// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// SerabeBar is the coolest bar in town. You come in with some Serabe, and leave with more! The longer you stay, the more Serabe you get.
//
// This contract handles swapping to and from xSerabe, SerabeSwap's staking token.
contract SerabeBar is ERC20("SerabeBar", "xSERABE"){
    using SafeMath for uint256;
    IERC20 public serabe;

    // Define the Serabe token contract
    constructor(IERC20 _serabe) public {
        serabe = _serabe;
    }

    // Enter the bar. Pay some SERABEs. Earn some shares.
    // Locks Serabe and mints xSerabe
    function enter(uint256 _amount) public {
        // Gets the amount of Serabe locked in the contract
        uint256 totalSerabe = serabe.balanceOf(address(this));
        // Gets the amount of xSerabe in existence
        uint256 totalShares = totalSupply();
        // If no xSerabe exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSerabe == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xSerabe the Serabe is worth. The ratio will change overtime, as xSerabe is burned/minted and Serabe deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSerabe);
            _mint(msg.sender, what);
        }
        // Lock the Serabe in the contract
        serabe.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SERABEs.
    // Unlocks the staked + gained Serabe and burns xSerabe
    function leave(uint256 _share) public {
        // Gets the amount of xSerabe in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Serabe the xSerabe is worth
        uint256 what = _share.mul(serabe.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        serabe.transfer(msg.sender, what);
    }
}
