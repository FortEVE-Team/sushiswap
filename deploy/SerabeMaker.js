const { WETH_ADDRESS } = require("@serabeswap/sdk")
module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()
  const chainId = await getChainId();


  const factory = await ethers.getContract("UniswapV2Factory")
  const bar = await ethers.getContract("SerabeBar")
  const serabe = await ethers.getContract("SerabeToken")
  
  // let wethAddress;
  let wethAddress = "0xB4cbAaF12a6491d1684A5286F69D970df39AA454"; // WRFA
  
  // if (chainId === '31337') {
  //   wethAddress = (await deployments.get("WETH9Mock")).address
  // } else if (chainId in WETH_ADDRESS) {
  //   wethAddress = WETH_ADDRESS[chainId]
  // } else {
  //   throw Error("No WETH!")
  // }

  await deploy("SerabeMaker", {
    from: deployer,
    args: [factory.address, bar.address, serabe.address, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("SerabeMaker")
  if (await maker.owner() !== dev) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["SerabeMaker"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "SerabeBar", "SerabeToken"]