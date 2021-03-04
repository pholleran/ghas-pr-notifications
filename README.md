# ghas-pr-notifications

> A GitHub App built with [Probot](https://github.com/probot/probot) to demonstrate how to add GitHub code scanning notifications to Pull Requests and track closed findings

## About the app

This demonstration Probot application is designed to promote greater visibility of GitHub code scanning alerts by adding a descriptive comment to Pull Requests when:

* a code scanning alert is found on the branch
* a code scanning alert found on the branch is dismissed

and by opening issues in a configured tracking repository in the organization every time a code scanning alert is dismissed by a user. Adding a notification to the Pull Request conversation is helpful for reviewers to understand exactly when alerts were created and, potentially, dismissed.

By default, the application expects a repository named `code-scanning-review` to exist in the organization, but it can be overridden if desired. The tracking repository can be used by security teams to review developer teams' code scanning alert dismissals and re-open issues that require further investigation.

### Examples

**comments in the pull request**

![image](https://user-images.githubusercontent.com/4007128/109251420-1169df80-77b1-11eb-9780-4f373cfe391b.png)

**issues opened in the tracking repo**

![image](https://user-images.githubusercontent.com/4007128/109251534-45450500-77b1-11eb-9865-59e87d21efba.png)

![image](https://user-images.githubusercontent.com/4007128/109251595-5d1c8900-77b1-11eb-873f-74284aa43c9b.png)

### Why Probot and not Actions?

GitHub Apps can be installed on all repositories in an organization, a group of repositories, or a single repository without a need to create a new Actions workflow in each repo. In this way an organization can install the app once and get its benefits everywhere.

### Extension

This patterns demonstrated in this application can be extended to meet your organization's requirements. Some possible modifications include:

- Creating tickets in your preferred ticketing system 
- Sending notifications through your chat systems

## Setup

Try it out by first creating a repository named `code-scanning-review` in your organization and [installing the app](https://github.com/apps/ghas-pr-notifications), or follow the directions below to customize the app and deploy it in an environment you control.

Follow the Probot [deployment](https://probot.github.io/docs/deployment/) documentation to deploy the app anywhere you can run a node application. It should be installed on all repositories in your organization to ensure all newly created repos send code scanning alerts to the app.

The basic scripts to get up and running are below:

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

### Optional Environment Variable

ghas-pr-notifications depends upon a tracking repository in which to open new issues when alerts are dismissed. If you wish to use a repository with a name other than `code-scanning-review` simply set the following environment variable:
 
```
SECURITY_REVIEW_REPO_NAME="repo-owner-here"
```

## Running in Docker

```sh
# 1. Build container
docker build -t ghas-pr-notifications .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> ghas-pr-notifications
```

## Contributing

If you have suggestions for how ghas-pr-notifications could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2021 Philip Holleran <pholleran@github.com>
