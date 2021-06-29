const github = require("@actions/github");
const core = require("@actions/core");

module.exports = async () => {
  const token = core.getInput("token");
  const octokit = github.getOctokit(token);

  try {
    const res = await octokit.rest.repos.listCommits({
      ...github.context.repo,
    });
    const commitSHAs = res.data.map((c) => c.sha);

    const badSHAs = [];
    for (const sha of commitSHAs) {
      const tree = await octokit.rest.git.getTree({
        ...github.context.repo,
        tree_sha: sha,
        recursive: 1,
      });

      if (tree.data.tree.some((t) => t.path === ".env")) badSHAs.push(sha);
    }

    if (badSHAs.length === 0) {
      return {
        reports: [
          {
            filename: "",
            isCorrect: true,
            display_type: "actions",
            level: "info",
            msg: "Great job!  You have successfully removed the sensitive info from this repo.",
            error: {
              expected: "",
              got: "",
            },
          },
        ],
      };
    } else {
      return {
        reports: [
          {
            filename: "",
            isCorrect: false,
            display_type: "actions",
            level: "warning",
            msg: `incorrect solution`,
            error: {
              expected: "All references to the .env file to be removed",
              got: `.env is still referenced in these commits: ${badSHAs}`,
            },
          },
        ],
      };
    }
  } catch (error) {
    return {
      reports: [
        {
          filename: filename,
          isCorrect: false,
          display_type: "actions",
          level: "fatal",
          msg: "",
          error: {
            expected: "",
            got: "An internal error occurred.  Please open an issue at: https://github.com/githubtraining/exercise-remove-commit-history and let us know!  Thank you",
          },
        },
      ],
    };
  }
};
