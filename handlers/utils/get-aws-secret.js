const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const secretsClient = new SecretsManagerClient({
  region: "eu-north-1",
});


exports.getAwsSecret = async function(secret_name, secret_key) {
  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
  );

  const secret_raw = response.SecretString;
  const secret_json = JSON.parse(secret_raw);
  return secret_json[secret_key];
}