// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

	// import "./IERC20.sol";
	import "./SafeMath.sol";


abstract contract IERC20 {
    function totalSupply() external virtual view returns (uint);
    function balanceOf(address Owner) external virtual view returns (uint balance);
    function allowance(address Owner, address user) external virtual view returns (uint available);
    function transfer(address to, uint tokens) external virtual returns (bool success);
    function approve(address user, uint tokens) external virtual returns (bool success);
    function transferFrom(address from, address to, uint tokens) external virtual returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed Owner, address indexed user, uint tokens);
}

contract DethlockCoin is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals; 
    uint256 public _totalSupply;

    mapping(address => uint) balances;
    mapping(address => mapping(address => uint)) usage;


    constructor() public {
        decimals = 18;
        _totalSupply = 100000000000000000000000000;
        balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function totalSupply() public virtual override view returns (uint) {
        return _totalSupply  - balances[address(0)];
    }

    function balanceOf(address Owner) public virtual override view returns (uint balance) {
        return balances[Owner];
    }

    function allowance(address Owner, address user) public virtual override view returns (uint available) {
        return usage[Owner][user];
    }

    function approve(address user, uint tokens) public virtual override returns (bool success) {
        usage[msg.sender][user] = tokens;
        emit Approval(msg.sender, user, tokens);
        return true;
    }

    function transfer(address to, uint tokens) public virtual override returns (bool success) {
        balances[msg.sender] = SafeMath.sub(balances[msg.sender], tokens);
        balances[to] = SafeMath.add(balances[to], tokens);
        emit Transfer(msg.sender, to, tokens);
        return true;
    }

    function transferFrom(address from, address to, uint tokens) public virtual override returns (bool success) {
        balances[from] = SafeMath.add(balances[from], tokens);
        usage[from][msg.sender] = SafeMath.sub(usage[from][msg.sender], tokens);
        balances[to] = SafeMath.add(balances[to], tokens);
        emit Transfer(from, to, tokens);
        return true;
    }
}