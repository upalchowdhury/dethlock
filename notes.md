
The stack looks like:
Ownable: contract deployer address is owner.  Can check bool = amIOwner();.  Can also transferOwnership(address newOwner), which transmits the OwnershipTransferred event.
Mortal (is Ownable): adds implode() onlyOwner that transmits the imploding event and fires selfdestruct(owner), erasing the contract from the EVM and dumping all balances to designated owner address.
Pausable (is Mortal): adds Paused and Unpaused modifiers, Pause() and Unpause() functions, and isPaused() query.  Allows critical contract function execution to be halted in-place in case of bug discovery.
Accountable (is Pausable): adds balance-tracking/reporting functions, receipt events, credit() for absorbing ETH, debt() for transmitting ETH, and salary() for transferring balance to the contract's owner.
Storage (is Accountable): contains the prototypes/interface definitions of all the mapping variables.  Contains _initialized flag.
Noun (is Storage): Contains the actual variable mappings, the Verb address, the upgrade() function for changing the Verb address, and forwards everything else to Verb via its fallback().
Verb (is Storage): Contains all the member functions that do anything on the mapping data stored in Noun.
Storage is really virtual.  Only its children (Noun and Verb) exist on-chain.  Noun assigns data in Storage mappings.  Verb just uses Storage as variable prototypes.
Noun still has a compile error involving an assembly language upgrade to 'gas'.  I'll figure that out soon, or ask someone smarter'n me.
Verb just has a few dumb sample functions to show syntax.
Accountable can only debt() to other users when the contract is unpaused.  It can only salary() to owner when the contract is paused.



Admittedly implode() would brick all held tokens.  Throwing it in is just part of my standard contract salad.  I should add a Never.sol that contains a require(false) and add that to implode().
address(this).balance won't work as a check.  That only checks Noun's ETH balance, not all the tokens in custodianship.  Those contracts would be bricked because implode() destroys Noun's address, which owns all the tokens.


Cool cool.. Implode() paused? Could be imploded acter heirs claim (address(this).balance==0)
I assume you have a concept of timelock but for basics there is one in commit
And finally i saw that 'gas' var in some proxy examples but not quite sure of its value..


Admittedly implode() would brick all held tokens.  Throwing it in is just part of my standard contract salad.  I should add a Never.sol that contains a require(false) and add that to implode().
address(this).balance won't work as a check.  That only checks Noun's ETH balance, not all the tokens in custodianship.  Those contracts would be bricked because implode() destroys Noun's address, which owns all the tokens.


Yeah, I just learned the Proxy pattern...uh...last week.  Give me a second to figure out the upgrade.  It works in 0.7, I just need to find someone who did the 0.8.0 upgrade and "imitation is the sincerest form of meeting schedule."
I think 'gas' is a pass-along of the transaction fees to the delegated function.
But 0.7 and 0.8 messed with the intrinsic 'gas' syntax.


=============================================///////////////=======================

I've been looking over Inherichain's code.  It seems like the whole contract is one will and it only handles raw ETH, no tokens.  That's highly disappointing, and a huge opportunity.
Most of Intellichain's code is about letting more people argue over if a claim is valid or not.  And its monolithic.  It has all the same onlyOwner and such, but none of it is modularized.  Its all stuffed in one massive contract.
Inherichain's contract code is 60% Kleros interface, 30% all the basic security foundations I just wrote up, and 10% "oh, the beneficiary might actually claim something."
They're also using truffle/ganache, not Scaffold.   That's obvious from the directory structure.
They do have an impressive test/ scripts folder.   I'll be looking at that for inspiration.  But again 60% of it is testing the kleros interface.
---------------------------------------------------
Ok, back to design thoughts on the Solidity side.  Storage needs to add a 'will' structure definition as a type.   That's NOT going to be upgradable, unfortunately, because I don't think you can mapping to a typedef (I'll test that theory tomorrow moring).  And then explicit:
mapping (uint256 => will) masterWillArray;
And that contains the individual will data.
Then for ownership:
mapping (uint256 => uinit256[]) folios;
Which will contain indexed sets of indexes owned by:
mapping(address => uint256) willFolioOf;
mapping(address => uint256) benificiaryFolioOf;
So...any address can have nothing, or an index to a folio.   A folio is an array of related will indexes in the masterWillArray.
A folio can contain none, one, or many indexes to wills.
There is no redundant or overlapping storage of wills.
Owners and benificiaries index into the same list of wills through different sets of indicies.
---------------------------------------------------
So what does a will contain?
1.) Raw ETH balance.
2.) A mapping of ERC20 contract addresses to balances.
3.) A dynamic-length array of addresses in play.
4.) A deadline date/time.
And that's it.
Ownership is derived from the index arrays and mappings.
So a 'will' exists between one owner and one beneficiary.  The owner can always withdraw.  The beneficiary can withdraw after the deadline.
A will can hold raw ETH, and any number of any balance of ERC20 tokens.
___
----------------------------------------------
Of course the root Noun address owns all ETH and tokens.  The rest of all that is just custodial accounting.
The rest of the logic is just record keeping of deposits and permission locking of withdraws.
The withdraw function should ask the user/beneficiary for an address to transmit ETH/Tokens to (defaults to connected wallet's address), the withdraw amount, and gas fees (defaults to pre-calculated).
The deposit function should have an entry for ETH and gas fees (defaults to calculated), and a section of available ERC20 tokens in the attached wallet with desired deposit amounts, a beneficiary address, and a deadline entry.
The contact builds the owner and beneficiary indices on deposit.
On withdraw the UI should aggregate all tokens and ETH available to the user from all wills on the same page and allow the user to select target address, gas fees, and ETH/token amounts for each withdraw.
-------------------------------------------
That should be complex enough to keep us busy for the remainder of the 'thon.



So orbit let me get my questions out, each Will then will have a token (+balance, +deadline, +eth) and its beneficiaries
Idk why the mapping Owners (is it for multiple Wills for Owner?)
DoursToday at 1:11 PM
yes it is
because of the constraint on having multiple coins in a will.
and the non-dynamic arrays in a mapping
so we have several wills.
DrHongoToday at 1:13 PM
is it needed? we could filter that information (for usage) in events
ok.. let me try to play with it first :sweat_smile:
orbitmechanicToday at 1:18 PM
Dours is correct.  Originally I was thinking a will could hold a dynamic length array of tokens.  But Solidity requires structures to be finite.  That locks is into one token per contract.  Could do two or three in a fixed-size array, but that wastes space and it's never the right size.
orbitmechanicToday at 1:22 PM
Try not to explicitly sort or filter in Solidity.  It's too expensive.  Use mappings instead as much as possible.  They get straight to answers, but their limitation is they're 1:1.  You can't map one to many.  So you need to stack them.
DoursToday at 1:31 PM
in Noun.sol
pragma solidity 0.8.0;
import "hardhat/console.sol";
import './inherited/Storage.sol';
i don't find the file in hardhat  and is there a typo ? shouldn't it be :
import "./hardhat/contracts/console.sol" ?
DrHongoToday at 1:34 PM
sure, i meant why should the contract have that mapping? we can filter any Owner Will's from the frontend
DoursToday at 1:34 PM
like you would do a API ?
DrHongoToday at 1:37 PM
yep, kind of. the-graph will give as a graphql query for any mappings we'll do from events. There we can have Will's objects and Owner's objects to query from
DoursToday at 1:42 PM
Except I don't know about the cost - I can't answer that question. But it seems for me obvious how to solve the problem in mappings having a stack and maybe resort to uint256 => will and address =>uint256 rather than address => will.
orbitmechanicToday at 4:34 PM
So you're proposing we store the relationship between addresses and wills externally from the contract?  Great idea for speeding up the UI.  But...it leaves the whole dap vulnerable to being knocked out of sync.  It gets lossy if there is more than one source of 'truth'.
Loading the data on-chain is expensive, but reading it is free.


