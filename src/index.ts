import { Probot } from "probot";
import dedent from "dedent";

export = (app: Probot) => {
  // handle newly created alerts
  app.on("code_scanning_alert.created", async (context) => {
    // check if a pull is associated with the event return it
    let prs = await getPRs(context);
    // if a pull is returned add a comment
    if (prs.length !== 0) {
      // create comment text
      let commentBody = dedent(`## :warning: Code Scanning Alert Introduced
      A code scanning alert has been detected on this branch by ${context.payload.alert.tool.name}.

      |   |   |
      | - | - |
      | **Rule:** | ${context.payload.alert.rule.id} |
      | **Severity:** | ${context.payload.alert.rule.severity} |
      | **Description:** | ${context.payload.alert.rule.description} |

      [View full details](${context.payload.alert.html_url})`);

      // create the comment
      prs.forEach(async (pr: any) => {
        // create the comment
        await context.octokit.issues.createComment({
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          issue_number: pr.number,
          body: commentBody,
        });
      });
    }
  });

  // handle user-closed findings
  app.on("code_scanning_alert.closed_by_user", async (context) => {
    // handle TypeScript's incomplete schema for the payload by forcing type
    const dismissedBy = context.payload.alert.dismissed_by as null | {
      login: string;
    };
    const user = dismissedBy!.login;
    const owner = process.env.SECURITY_REVIEW_REPO_OWNER || context.payload.repository.owner.login;
    const repo = process.env.SECURITY_REVIEW_REPO_NAME || "code-scanning-review";

    // create body text for issue in security alert review tracking repo
    let issueBody = dedent(`## :warning: Code Scanning Alert Dismissed
      A code scanning alert created by \`${context.payload.alert.tool.name}\` in \`${context.payload.repository.full_name}\` was dismissed by @${user}.

      |   |   |
      | - | - |
      | **Repo:** | ${context.payload.repository.full_name} |
      | **Rule:** | ${context.payload.alert.rule.id} |
      | **Severity:** | ${context.payload.alert.rule.severity} |
      | **Description:** | ${context.payload.alert.rule.description} |
      | **Reason:** | ${context.payload.alert.dismissed_reason} |
      | **Time:** | ${context.payload.alert.dismissed_at} |

      [View full details](${context.payload.alert.html_url})`);
    // create an issue in the security alert review tracking repo
    await context.octokit.issues.create({
      owner: owner,
      repo: repo,
      title:
        context.payload.alert.tool.name +
        " alert dismissed as " +
        context.payload.alert.dismissed_reason +
        " by @" +
        user,
      body: issueBody,
    });

    // check if a pull is associated with the event & return it
    let prs = await getPRs(context);

    // if a pull is returned add a comment to the PR about the dismissal
    if (prs.length !== 0) {
      // create body text for PR comment
      let commentBody = dedent(`## :warning: Code Scanning Alert Dismissed
      A code scanning alert on this branch created by \`${context.payload.alert.tool.name}\` was dismissed by @${user}.

      |   |   |
      | - | - |
      | **Rule:** | ${context.payload.alert.rule.id} |
      | **Severity:**  | ${context.payload.alert.rule.severity} |
      | **Description:** | ${context.payload.alert.rule.description} |
      | **Reason:** | ${context.payload.alert.dismissed_reason} |
      | **Time:** | ${context.payload.alert.dismissed_at} |

      [View full details](${context.payload.alert.html_url})`);

      prs.forEach(async (pr: any) => {
        // create the comment
        await context.octokit.issues.createComment({
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          issue_number: pr.number,
          body: commentBody,
        });
      });
    }
  });

  // use the ref in the payload to find associated pull request
  async function getPRs(context: any) {
    let result, head;
    // check if ref is a branch
    if (context.payload.ref.startsWith("refs/heads/")) {
      head =
        context.payload.repository.owner.login +
        ":" +
        context.payload.ref.substring(11);
      // if ref is empty check instances for a valid ref
    } else if (context.payload.alert.instances) {
      console.log(context.payload.alert.instances);
      let done = false;
      let i = 0;
      while (!done) {
        if (context.payload.alert.instances[i].ref.startsWith("refs/heads/")) {
          console.log(i + " - " + context.payload.alert.instances[i].ref);
          head =
            context.payload.repository.owner.login +
            ":" +
            context.payload.alert.instances[i].ref.substring(11);
          done = true;
        } else if (i < context.payload.alert.instances.length) {
          i++;
        } else {
          done = true;
        }
      }
    }
    if (head) {
      console.log(head);
      // get the pull request associated with the branch
      let pulls = await context.octokit.pulls.list({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        head: head,
      });
      console.log(pulls.data.length);
      result = pulls.data;
    }
    return result;
  }
};
