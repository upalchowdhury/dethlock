/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { Button, Divider, Input, Card, DatePicker, Select } from "antd";
import { parseEther } from "@ethersproject/units";
import { useQuery, gql } from "@apollo/client";
import { Address, Balance, AddressInput, TokenInput } from "../components";

const { Option } = Select;
console.log(Option);

export default function Create({
  address,
  mainnetProvider,
  localProvider,
  price,
  tx,
  readContracts,
  writeContracts,
  willIndex,
}) {
  const [beneficiaries, setBeneficiaries] = useState(null);
  const [depositEth, setDepositEth] = useState(0);
  const [depositValue, setDepositValue] = useState(0);
  const [deadline, setDeadline] = useState(null);
  // const [editable, setEditable] = useState(true);
  const [tokenAddress, setTokenAddress] = useState(null);

  const ts = Math.floor(new Date().getTime() / 1000);

  const QUERY_WILL = gql`
    query Will($test: BigInt!) {
      wills(where: { index: $test }) {
        index
        owner
        beneficiary
        deadline
        value
        token
        tokenBalance
      }
    }
  `;

  const { data } = useQuery(QUERY_WILL, { variables: { test: willIndex }, pollInterval: 2500 });

  const ourTokensList = [
    { name: "MoCoin", address: readContracts.MoCoin.address },
    { name: "LarryCoin", address: readContracts.LarryCoin.address },
    { name: "CurlyCoin", address: readContracts.CurlyCoin.address },
  ];

  return (
    <div>
      {data == null ? (
        <h3>Create</h3>
      ) : (
        <div>
          <p>Will selected: {willIndex}</p>
          <h3>Update</h3>
        </div>
      )}
      <h2>TimeLock</h2>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 600, margin: "auto", marginTop: 64 }}>
        {data == null ? (
          <TokenInput
            price={price}
            ourTokensList={ourTokensList}
            onTokenSelected={setTokenAddress}
            onTokenValue={setDepositValue}
            onEthValue={setDepositEth}
          />
        ) : (
          <div>
            Token: {data.wills[0].token}
            <br />
            Token Balance: {data.wills[0].tokenBalance}
            <br />
            It is needed to define tokenAddress in initialize for having it already...
            <br />
            <Input
              onChange={e => {
                setDepositValue(e.target.value);
              }}
            />
            <Button
              disabled={!depositValue}
              onClick={async () => {
                await tx({
                  to: writeContracts.Noun.address,
                  data: writeContracts.Noun.interface.encodeFunctionData(
                    "depositTokensToWill(uint256,address,uint256)",
                    [willIndex - 1, data.wills[0].token, parseEther(depositValue)],
                  ),
                });
              }}
            >
              Deposit tokens
            </Button>
            <br />
            <Input
              onChange={e => {
                setDepositEth(e.target.value);
              }}
            />
            <Button
              disabled={!depositEth}
              onClick={async () => {
                await tx({
                  to: writeContracts.Noun.address,
                  value: parseEther(depositEth),
                  data: writeContracts.Noun.interface.encodeFunctionData("fundWillETH(uint256)", [willIndex - 1]),
                });
              }}
            >
              Deposit ETH
            </Button>
            <br />
          </div>
        )}
        <Divider />
        {data == null ? (
          <Card style={{ marginTop: 32 }}>
            <div style={{ marginTop: 8 }}>
              <h3> DethLOCK time </h3>
              <DatePicker
                onChange={e => {
                  const dateSelected = new Date(e);
                  setDeadline(Math.floor(dateSelected.getTime() / 1000));
                }}
              />
              <Button
                onClick={() => {
                  setDeadline(ts + 60);
                }}
              >
                {" "}
                +1min
              </Button>
            </div>
          </Card>
        ) : (
          <div>
            Deadline: {new Date(data.wills[0].deadline * 1000).toISOString()} <br />
            <DatePicker
              onChange={e => {
                const dateSelected = new Date(e);
                setDeadline(Math.floor(dateSelected.getTime() / 1000));
              }}
            />
            <Button
              onClick={() => {
                setDeadline(ts + 60);
              }}
            >
              {" "}
              +1min
            </Button>
            <br />
            <Button
              disabled={!deadline}
              onClick={async () => {
                await tx({
                  to: writeContracts.Noun.address,
                  data: writeContracts.Noun.interface.encodeFunctionData("setDeadline(uint256,uint256)", [
                    willIndex - 1,
                    deadline,
                  ]),
                });
              }}
            >
              Set new deadline
            </Button>
            <br />
          </div>
        )}
        <Divider />
        <AddressInput
          // ensProvider={props.ensProvider}
          placeholder="beneficiary"
          value={beneficiaries}
          onChange={setBeneficiaries}
        />
        {data == null ? null : (
          <div>
            Current Benefactor:
            <Address value={data.wills[0].beneficiary} ensProvider={mainnetProvider} />
            <br />
            <Button
              disabled={!beneficiaries}
              onClick={async () => {
                await tx({
                  to: writeContracts.Noun.address,
                  data: writeContracts.Noun.interface.encodeFunctionData("setBeneficiary(uint256,address)", [
                    willIndex - 1,
                    beneficiaries,
                  ]),
                });
              }}
            >
              Change beneficiary
            </Button>
            <br />
          </div>
        )}

        <Divider />
        {data == null ? (
          <Button
            type="primary"
            disabled={!beneficiaries || !deadline}
            onClick={async () => {
              const res = await tx({
                to: writeContracts.Noun.address,
                value: parseEther(depositEth),
                data: writeContracts.Noun.interface.encodeFunctionData(
                  "createNewWill(address, address, address, uint256)",
                  [address, beneficiaries, tokenAddress, deadline],
                ),
              });
              console.log(res);
            }}
          >
            Create
          </Button>
        ) : null}
        <br />
        {ts || null}
      </div>
      TimeLock Address:
      <Address
        value={readContracts ? readContracts.Noun.address : readContracts}
        ensProvider={mainnetProvider}
        fontSize={16}
      />{" "}
      <br />
      <Balance
        address={readContracts ? readContracts.Noun.address : readContracts}
        provider={localProvider}
        dollarMultiplier={price}
      />
    </div>
  );
}
