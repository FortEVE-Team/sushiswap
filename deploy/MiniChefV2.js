const { SERABE_ADDRESS } = require("@serabeswap/sdk");

module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments;

  const { deployer, dev } = await getNamedAccounts();

  const chainId = await getChainId();

  let serabeAddress;

  if (chainId === "31337") {
    serabeAddress = (await deployments.get("SerabeToken")).address;
  } else if (chainId in SERABE_ADDRESS) {
    serabeAddress = SERABE_ADDRESS[chainId];
  } else {
    throw Error("No SERABE!");
  }

  await deploy("MiniChefV2", {
    from: deployer,
    args: [serabeAddress],
    log: true,
    deterministicDeployment: false,
  });

  const miniChefV2 = await ethers.getContract("MiniChefV2");
  if ((await miniChefV2.owner()) !== dev) {
    console.log("Transfer ownership of MiniChef to dev");
    await (await miniChefV2.transferOwnership(dev, true, false)).wait();
  }
};

module.exports.tags = ["MiniChefV2"];
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
