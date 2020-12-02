import { CCard, CCardBody, CCardHeader } from "@coreui/react";
import React from "react";
import Web3 from "web3";
import { myBlocABI, myBlocAddress, projectId } from "../../config";
import processError from "../../util/ErrorUtil";
import "./Post.scss";
import PostViewComponent from "./PostViewComponent";

const Tx = require("ethereumjs-tx").Transaction;

let web3;
let myBlocContract;

class Post extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: parseInt(props.match.params.postId),
      post: null,
      loading: false,
    };

    this.loadPost(true);
  }

  async loadPost(initialLoad) {
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

      const post = await myBlocContract.methods
        .getPostDetails(this.state.id)
        .call();

      try {
        const ipfsHash = await myBlocContract.methods
          .viewPost(this.state.id)
          .call({ from: this.props.accountId });

        this.setState({
          post: { ...post, ipfsHash: ipfsHash },
        });
      } catch (err) {
        if (!initialLoad) {
          processError(err);
        }

        this.setState({
          post,
        });
      }
    } catch (err) {
      // invalid post
      processError(err);
    }
  }

  async purchasePost() {
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
          value: web3.utils.toHex(this.state.post.fee),
          data: myBlocContract.methods.buyPost(this.state.id).encodeABI(),
        };

        const tx = new Tx(txObject, { chain: "ropsten" });
        tx.sign(Buffer.from(this.props.privateKey.substr(2), "hex"));

        const serializedTx = tx.serialize();
        const raw = "0x" + serializedTx.toString("hex");

        this.setState({ loading: true });

        await web3.eth.sendSignedTransaction(raw).catch((err) => {
          processError(err);
        });

        this.setState({ loading: false });
        this.loadPost(false);
      } else {
        await myBlocContract.methods.buyPost(this.state.id).send(
          {
            from: this.props.accountId,
            value: this.state.post.fee,
            gas: 6700000,
          },
          (error) => {
            if (!error) {
              this.loadPost(false);
            } else {
              processError(error);
            }
          }
        );
      }
    } catch (err) {
      processError(err);
    }
  }

  render() {
    return (
      <>
        <CCard>
          <CCardHeader>
            <h3 className="display-inline">{"Post #" + this.state.id}</h3>
          </CCardHeader>
        </CCard>
        <CCard>
          <CCardBody>
            {!!this.state.post ? (
              <PostViewComponent
                post={this.state.post}
                purchasePost={this.purchasePost.bind(this)}
                accountId={this.props.accountId}
                privateKey={this.props.privateKey}
                loading={this.state.loading}
                key={this.state.post.id}
              />
            ) : (
              <div className="text-align-center">Loading...</div>
            )}
          </CCardBody>
        </CCard>
      </>
    );
  }
}

export default Post;
