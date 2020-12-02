import { brandSet, freeSet } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import React from "react";
import Web3 from "web3";
import { myBlocABI, myBlocAddress, projectId } from "../../config";
import processError from "../../util/ErrorUtil";
import "./Post.scss";

const Tx = require("ethereumjs-tx").Transaction;

let web3;
let myBlocContract;

class FeeLikeIconComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      likes: props.likes,
      dislikes: props.dislikes,
      fee: props.fee,
      id: props.id,
      disableOnClick: !!!props.disableOnClick,
      alreadyVoted: false,
    };
  }

  static getDerivedStateFromProps(newProps, state) {
    if (!!newProps) {
      state = {
        likes: !!state.likes ? state.likes : newProps.likes,
        dislikes: !!state.dislikes ? state.dislikes : newProps.dislikes,
        fee: newProps.fee,
        id: newProps.id,
        disableOnClick: !!!newProps.disableOnClick,
      };

      return state;
    }

    return state;
  }

  async dislikePost() {
    try {
      // If private key is not set then do not proceed
      if (!this.props.accountId) {
        return;
      }

      // if web3 or contract haven't been intialized then do so
      if (!web3 || !myBlocContract) {
        web3 = new Web3(
          new Web3.providers.HttpProvider(
            !!this.props.privateKey
              ? "https://ropsten.infura.io/v3/" + projectId
              : "http://localhost:8545"
          )
        );
        myBlocContract = new web3.eth.Contract(myBlocABI, myBlocAddress);
      }

      if (!!this.props.privateKey) {
        const txCount = await web3.eth.getTransactionCount(
          this.props.accountId
        );

        const txObject = {
          nonce: web3.utils.toHex(txCount),
          gasLimit: web3.utils.toHex(6700000),
          gasPrice: web3.utils.toHex(
            Math.ceil((await web3.eth.getGasPrice()) * 1.25)
          ),
          to: myBlocContract._address,
          data: myBlocContract.methods
            .ratePost(this.state.id, false)
            .encodeABI(),
        };

        const tx = new Tx(txObject, { chain: "ropsten" });
        tx.sign(Buffer.from(this.props.privateKey.substr(2), "hex"));

        const serializedTx = tx.serialize();
        const raw = "0x" + serializedTx.toString("hex");

        web3.eth.sendSignedTransaction(raw);
      } else {
        await myBlocContract.methods
          .ratePost(this.state.id, false)
          .send({ from: this.props.accountId });
      }

      this.setState({
        dislikes: parseInt(this.state.dislikes) + 1,
        alreadyVoted: true,
      });
    } catch (err) {
      console.log(err);
      processError(err);
    }
  }

  async likePost() {
    try {
      if (this.state.alreadyVoted) {
        processError({ reason: "E005" });

        return;
      }

      // If private key is not set then do not proceed
      if (!this.props.accountId) {
        return;
      }

      // if web3 or contract haven't been intialized then do so
      if (!web3 || !myBlocContract) {
        web3 = new Web3(
          new Web3.providers.HttpProvider(
            !!this.props.privateKey
              ? "https://ropsten.infura.io/v3/" + projectId
              : "http://localhost:8545"
          )
        );
        myBlocContract = new web3.eth.Contract(myBlocABI, myBlocAddress);
      }

      if (!!this.props.privateKey) {
        const txCount = await web3.eth.getTransactionCount(
          this.props.accountId
        );

        const txObject = {
          nonce: web3.utils.toHex(txCount),
          gasLimit: web3.utils.toHex(6700000),
          gasPrice: web3.utils.toHex(
            Math.ceil((await web3.eth.getGasPrice()) * 1.25)
          ),
          to: myBlocContract._address,
          data: myBlocContract.methods
            .ratePost(this.state.id, true)
            .encodeABI(),
        };

        const tx = new Tx(txObject, { chain: "ropsten" });
        tx.sign(Buffer.from(this.props.privateKey.substr(2), "hex"));

        const serializedTx = tx.serialize();
        const raw = "0x" + serializedTx.toString("hex");

        web3.eth.sendSignedTransaction(raw).catch((err) => {
          processError(err);
        });
      } else {
        await myBlocContract.methods
          .ratePost(this.state.id, true)
          .send({ from: this.props.accountId });
      }

      this.setState({
        likes: parseInt(this.state.likes) + 1,
        alreadyVoted: true,
      });
    } catch (err) {
      processError(err);
    }
  }

  render() {
    return (
      <div className={"post-icons"}>
        <div className={"icon-holder"}>
          <CIcon content={brandSet.cibEthereum} size="2xl" />
          <span className={"icon-text"}>{"WEI " + this.state.fee}</span>
        </div>
        <div className="thumbs-icon-holder">
          <div
            className={"icon-holder hand-cursor"}
            onClick={
              this.state.disableOnClick ? this.likePost.bind(this) : () => {}
            }
          >
            <CIcon content={freeSet.cilThumbUp} size="2xl" />
            <span className={"icon-text"}>{"x" + this.state.likes}</span>
          </div>
          <div
            className={"icon-holder hand-cursor"}
            onClick={
              this.state.disableOnClick ? this.dislikePost.bind(this) : () => {}
            }
          >
            <CIcon content={freeSet.cilThumbDown} size="2xl" />
            <span className={"icon-text"}>{"x" + this.state.dislikes}</span>
          </div>
        </div>
      </div>
    );
  }
}

export default FeeLikeIconComponent;
