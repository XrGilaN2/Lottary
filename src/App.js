/* global ethereum */
import React, { Component } from 'react';
import './styles.css';
import 'bootstrap/dist/css/bootstrap.css';
import web3 from './web3';
import lottery from './lottery';
import CarImg from './images/Car.jpg';
import PhoneImg from './images/Phone.jpg';
import ComputerImg from './images/Computer.jpg';


class App extends Component {
  state = {
    manager: "",
    players: [],
    balance: "",
    items: [
      { itemId: 0, itemTokens: 0 },
      { itemId: 1, itemTokens: 0 },
      { itemId: 2, itemTokens: 0 }
    ],
    winners: [],
    value: "",
    popupMessage: "",
    currentAccount: "",
	  message: "",
	  newManager: "",
    isOwner: false, 
    isLotteryComplete: false 
  };

  async componentDidMount() {
    // Αποθηκεύω το current account του Metamask
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0];

    // Αποθηκεύω τους manager, players,items απο το συμβόλαιο
    const manager = await lottery.methods.beneficiary().call();
    const players = await lottery.methods.getBidders().call();
    const items = await lottery.methods.getItems().call();

    //Αποθηκεύω το balance και το μετατρέπω σε Ether
    const balance = await web3.eth.getBalance(lottery.options.address);
    const balanceEther = web3.utils.fromWei(balance, 'ether');

    //bool ώστε να ελέγχει αν είναι ο Owner ή αν έχει ολοκληρωθεί η λαχειοφόρος
    const isOwner = currentAccount === manager;
    const isLotteryComplete = await lottery.methods.lotteryComplete().call();

	  this.getWalletAddress();
    this.setState({ manager, players, balanceEther, currentAccount, items, isOwner, isLotteryComplete });

    //Πυροδότηση Event
    lottery.events.TicketPurchased({}, async (error, event) => {
      if (error) {
        console.error(error);
      } else {
        const items = await lottery.methods.getItems().call();
        const balance = await web3.eth.getBalance(lottery.options.address);
        const balanceEther = web3.utils.fromWei(balance, 'ether');
        const bidder = event.returnValues.user;

        //Ανανέωση του πλήθους των bids
        const itemId = parseInt(event.returnValues.itemId);
        const newItemId = itemId + 1;

        //Ετοιμασία του PopUpMessage
        const popupMessage = `Player ${bidder} purchased ticket ${newItemId}`;
        this.setState({ items, balanceEther, popupMessage });
      }
    });

    //Πυροδότηση Event
    lottery.events.Winner({}, async (error, event) => {
      if (error) { console.error(error);
      } else {
        const players = await lottery.methods.getBidders().call();
        const balance = await web3.eth.getBalance(lottery.options.address);
        const balanceEther = web3.utils.fromWei(balance, 'ether');
        const lastWinner = event.returnValues.winner;
        this.setState({ lastWinner, players, balanceEther });
      }
    });

  }

  //Η λειτουργία withdraw
  withdrawFunds = async () => {
    const { currentAccount } = this.state;
  
    this.setState({ message: "Waiting on transaction success..." });
    try {
      const contractOwner = await lottery.methods.beneficiary().call();
      await lottery.methods.withdraw().send({ from: currentAccount });
      this.setState({ popupMessage: "Withdrawal succesful!" });
    } catch (error) {
      console.error("Withdrawal error:", error);
    }
  }
  
  //Η λειτουργία Transfer Ownership
  transferOwnership = async () => {
    const { currentAccount, newManager } = this.state;

    this.setState({ message: "Waiting on transaction success..." });
    try {
      await lottery.methods.transferOwnership(newManager).send({ from: currentAccount });
      this.setState({ popupMessage: "Ownership transfer succesful!" });
    } catch (error) {
      console.error("Ownership transfer error:", error);
    }
  }
  handleNewOwnerAddressChange = (event) => {
    this.setState({ newManager: event.target.value });
  }


  //H λειτουργία AmIWinner
  amIWinner = async () => {
    const { currentAccount } = this.state;
    try {
      const itemNumbers = await lottery.methods.amIWinner().call({ from: currentAccount });

      if (itemNumbers.length > 0) {
        this.setState({ popupMessage: `Congratulations! You have won the following item(s): ${itemNumbers.join(', ')}` });
      } else {
        this.setState({ popupMessage: "Sorry, you have not won anything." });
      }
    } catch (error) {
      console.error("Am I winner error:", error);
    }
  }


  //Η λειτουργία Declare Winner
  declareWinner = async () => {
    const { currentAccount } = this.state;
  
    this.setState({ message: "Waiting on transaction success..." });
    try {
      const winners = await lottery.methods.revealWinners().send({ from: currentAccount });
      this.setState({ winners, popupMessage: "Winners declared succesful!" });
    } catch (error) {
      console.error("Declare winner error:", error);
    }
  }


  //Η λειτουργία Reset Contract
  resetContract = async () => {
    const { currentAccount } = this.state;
  
    this.setState({ message: "Waiting on transaction success..." });
    try {
      await lottery.methods.reset().send({ from: currentAccount });
      this.setState({ popupMessage: "New lottery cycle started!" });
    } catch (error) {
      console.error("Start new cycle error:", error);
    }
  }


  //Η λειτουργία Destroy Contract
  destroyContract = async () => {
    const { currentAccount } = this.state;

    this.setState({ message: "Waiting on transaction success..." });
    try {
      await lottery.methods.destroyContract().send({ from: currentAccount });
      this.setState({ popupMessage: "Contract destroyed!" });
    } catch (error) {
      // Handle any errors that occurred during the contract destruction process
      console.error("Contract destruction error:", error);
    }
  }

  onBid = async (event, itemIndex) => {
    event.preventDefault();

    const { currentAccount } = this.state;

    // Ετοιμασία του Bid
    this.setState({ message: "Waiting on transaction success..." });
    await lottery.methods.bid(itemIndex).send({
      from: currentAccount,
      value: web3.utils.toWei("0.01", "ether")
    });

    this.setState({ message: "You have been Bid!" });
  };


  // Κάνει get τη διευθηνση του wallet
  getWalletAddress = () => {
    if (typeof window.ethereum !== 'undefined') {
      ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            this.setState({ currentAccount });
          } else {
            console.log('No accounts found');
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.log('Metamask not detected');
    }
  };

  render() {

    const { isOwner, isLotteryComplete } = this.state;

    return (
      <div className="App">
        <h1>Lottery-Ballot DApp</h1>
        <div id="items-container">
          <div className="item">
            <img src={CarImg} alt="Item Image" />
            <h2>Car</h2>
            <p id="car"></p>
            <button className="blue" disabled={isOwner || isLotteryComplete}  onClick={(event) => this.onBid(event, 0)}>Bid</button>
            <p className="itemTokens">{this.state.items[0].itemTokens}</p>
          </div>
          <div className="item">
            <img src={PhoneImg} alt="Item Image" />
            <h2>Phone</h2>
            <p id="phone"></p>
            <button className="blue" disabled={isOwner || isLotteryComplete} onClick={(event) => this.onBid(event, 1)}>Bid</button>
            <p className="itemTokens">{this.state.items[1].itemTokens}</p>
          </div>
          <div className="item">
            <img src={ComputerImg} alt="Item Image" />
            <h2>Computer</h2>
            <p id="computer"></p>
            <button className="blue" disabled={isOwner || isLotteryComplete} onClick={(event) => this.onBid(event, 2)}>Bid</button>
            <p className="itemTokens">{this.state.items[2].itemTokens}</p>
          </div>
        </div>

        <div id="actions-container">

          <div className="address-container marginDown">
            <div>
              <label className="marginLeft">Current Account:</label>
              <input className="address" type="text" id="currentAddress" value={this.state.currentAccount} readOnly />
            </div>
            <div>
              <label>Contract Owner:</label>
              <input className="address marginRight" type="text" id="ownerAddress" value={this.state.manager} readOnly />
            </div>
          </div>

          <button className="blue marginLeft marginDown" disabled={isOwner || !isLotteryComplete} onClick={this.amIWinner}>Am I Winner</button>
          <div className="rightSide marginRight marginTop">
            <div>
              <input
                type="text"
                id="newManager"
                value={this.state.newManager}
                onChange={this.handleNewOwnerAddressChange}
                placeholder="New Owner Address"
              />
              <button className="orange marginDown" disabled={!isOwner} onClick={this.transferOwnership}>Transfer Ownership</button>
            </div>
            <div>
		          <button className="green" disabled={!isOwner || !isLotteryComplete} onClick={this.withdrawFunds}>Withdraw</button>
              <button className="green" disabled={!isOwner} onClick={this.declareWinner}>Declare Winner</button>
              <button className="orange" disabled={!isOwner || !isLotteryComplete} onClick={this.resetContract}>Reset Contract</button>
              <button className="red marginDown" disabled={!isOwner} onClick={this.destroyContract}>Destroy Contract</button>
              <p>Contract Balance: {this.state.balanceEther} Ether</p>
            </div>
          </div>
        </div>
        <p className="marginLeft message marginDown">{this.state.message}</p>
        <div className="messagePopUp marginLeft">{this.state.popupMessage}</div>
      </div>
    );
  }
}

export default App;