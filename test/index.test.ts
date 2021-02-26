import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src";
import { Probot, ProbotOctokit } from "probot";
// Requiring our fixtures
import payload_created from "./fixtures/code-scanning-result.created.json";
import payload_closed from "./fixtures/code-scanning-result.closed-by-user.json";

const fs = require("fs");
const path = require("path");

const prComment = fs.readFileSync(
  path.join(__dirname, "fixtures/pr-comment-body.txt"),
  "utf8"
);
const prCommentBody = { body: prComment };
const issueComment = fs.readFileSync(
  path.join(__dirname, "fixtures/issue-comment-body.txt"),
  "utf8"
);
const issueCommentBody = { body: issueComment };

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("Testing the app", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test("creates a PR comment when an new alert is raised on an open branch with a PR", async (done) => {
    const mock = nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // mock the post to the pr endpoint
      .get("/repos/Codertocat/Hello-World/pulls")
      .query({
        head: "Codertocat:code-feature",
      })
      .reply(200, {
        base: {
          repo: {
            owner: {
              login: "Codertocat",
            },
            name: "Hello-World",
          },
        },
        number: 1,
      })

      // test PR comment is created
      .post("/repos/Codertocat/Hello-World/issues/1/comments", (body) => {
        done(expect(body).toMatchObject(prCommentBody));
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({
      name: "code_scanning_alert",
      payload: payload_created,
    });
    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("creates an issue in the configured repository when a user dismisses an alert", async (done) => {
    const mock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // test that an issue is created
      .post("/repos/Codertocat/Hello-World/issues", (body) => {
        done(expect(body).toMatchObject(issueCommentBody));
        return true;
      })
      .reply(200);

    await probot.receive({
      name: "code_scanning_alert",
      payload: payload_closed,
    });
    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
