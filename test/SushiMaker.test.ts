import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("SerabeMaker", function () {
  before(async function () {
    await prepare(this, ["SerabeMaker", "SerabeBar", "SerabeMakerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["serabe", this.ERC20Mock, ["SERABE", "SERABE", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.SerabeBar, [this.serabe.address]]])
    await deploy(this, [["serabeMaker", this.SerabeMaker, [this.factory.address, this.bar.address, this.serabe.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.SerabeMakerExploitMock, [this.serabeMaker.address]]])
    await createSLP(this, "serabeEth", this.serabe, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "serabeUSDC", this.serabe, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Serabe", async function () {
      await expect(this.serabeMaker.setBridge(this.serabe.address, this.weth.address)).to.be.revertedWith("SerabeMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.serabeMaker.setBridge(this.weth.address, this.serabe.address)).to.be.revertedWith("SerabeMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.serabeMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("SerabeMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.serabeMaker.setBridge(this.dai.address, this.serabe.address))
        .to.emit(this.serabeMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.serabe.address)
    })
  })
  describe("convert", function () {
    it("should convert SERABE - ETH", async function () {
      await this.serabeEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.convert(this.serabe.address, this.weth.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabeEth.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - SERABE", async function () {
      await this.serabeUSDC.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.convert(this.usdc.address, this.serabe.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabeUSDC.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.convert(this.dai.address, this.weth.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.setBridge(this.usdc.address, this.serabe.address)
      await this.serabeMaker.setBridge(this.mic.address, this.usdc.address)
      await this.serabeMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.setBridge(this.usdc.address, this.serabe.address)
      await this.serabeMaker.setBridge(this.dai.address, this.usdc.address)
      await this.serabeMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.setBridge(this.dai.address, this.usdc.address)
      await this.serabeMaker.setBridge(this.mic.address, this.dai.address)
      await this.serabeMaker.convert(this.dai.address, this.mic.address)
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.setBridge(this.dai.address, this.mic.address)
      await this.serabeMaker.setBridge(this.mic.address, this.dai.address)
      await expect(this.serabeMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.serabeEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.serabe.address, this.weth.address)).to.be.revertedWith("SerabeMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.serabeMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("SerabeMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.serabeMaker.address, getBigNumber(1))
      await expect(this.serabeMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("SerabeMaker: Cannot convert")
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.serabeMaker.address)).to.equal(getBigNumber(1))
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeEth.transfer(this.serabeMaker.address, getBigNumber(1))
      await this.serabeMaker.convertMultiple([this.dai.address, this.serabe.address], [this.weth.address, this.weth.address])
      expect(await this.serabe.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.serabeMaker.address)).to.equal(0)
      expect(await this.serabe.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
