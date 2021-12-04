module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const serabe = await deployments.get("SerabeToken")

  await deploy("SerabeBar", {
    from: deployer,
    args: [serabe.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["SerabeBar"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "SerabeToken"]
