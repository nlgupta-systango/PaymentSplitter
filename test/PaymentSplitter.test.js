const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectEvent, // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    time,
} = require("@openzeppelin/test-helpers");

const { fromWei, toWei } = require("web3-utils");
// const keccak256 = require("keccak256");
const PaymentSplitter = artifacts.require("PaymentSplitter");

contract("PaymentSplitter", (accounts) => {

    const EventNames = {
        PayeeAdded: "PayeeAdded",
        PaymentReleased: "PaymentReleased",
        PaymentReceived: "PaymentReceived"

    };

    const [owner, user, bob, steve, blackListUser, george, nonWhiteListUser] = accounts;
    const USERADDRESS2 = ["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0", "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b"];
    const USERADDRESS = [user, bob, steve];
    const USERSHARE = [30, 20, 50];
    const WRONGUSERSHARE = [30, 20, 40,10];
    const TOTALSHARE = 100;
    const percentage = 50;
    const UNLOCKTIME = 9;//second
    const sendAmt = toWei("1", "ether");
    const user1Releasable = (sendAmt * USERSHARE[0]) / 100;
    const EMPTYUSERS=[];
    const EMPTYSHARES=[];
    const INVALID_SHARE=[10,0,90];
    const zeroAddress='0x0000000000000000000000000000000000000000';
    const INVALID_USER_ADS=[zeroAddress,bob,steve];
    const SAME_USER_ADS=[bob,bob,steve];



    const nullBytes = "0x";
    let currentTime = Math.floor((new Date() / 1000))
    let PaymentSplitterInstance = null;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function initContract() {
        PaymentSplitterInstance = await PaymentSplitter.new(USERADDRESS, USERSHARE, UNLOCKTIME, { from: owner });


    }
   
    before("Deploy new PaymentSplitter Contract", async () => {
        await initContract();

    });

    describe("contract deployment", () => {
        describe("when the PaymentSplitter contract deploy with wrong shares argument", function () {
            it("should not deploy a new  contract", async () => {
            
                await expectRevert(PaymentSplitter.new(USERADDRESS, WRONGUSERSHARE, UNLOCKTIME, { from: owner }),
                "PaymentSplitter: payees and shares length mismatch"
            );
            });

        });

        describe("when the PaymentSplitter contract deploy with emply zero length", function () {
            it("should not deploy a new  contract", async () => {
            
                await expectRevert(PaymentSplitter.new([], [], UNLOCKTIME, { from: owner }),
                "PaymentSplitter: no payees"
            );
            });

        });

        describe("when the PaymentSplitter contract deploy with zero address in payee ", function () {
            it("should not deploy a new contract", async () => {
                await expectRevert(PaymentSplitter.new(INVALID_USER_ADS, INVALID_SHARE, UNLOCKTIME, { from: owner }),
                "PaymentSplitter: account is the zero address"
            );
            });

        });

        describe("when the PaymentSplitter contract deploy with zero share value ", function () {
            it("should not deploy a new contract", async () => {
            
              
            
                await expectRevert(PaymentSplitter.new(USERADDRESS, INVALID_SHARE, UNLOCKTIME, { from: owner }),
                "PaymentSplitter: shares are 0"
            );
            });

        });

        describe("when the PaymentSplitter contract deploy with same payee address ", function () {
            it("should not deploy a new contract", async () => {
            
             
            
                await expectRevert(PaymentSplitter.new(SAME_USER_ADS, USERSHARE, UNLOCKTIME, { from: owner }),
                "PaymentSplitter: account already has shares"
            );
            });

        });
    });


    describe("Initial State", () => {
        describe("when the PaymentSplitter contract is instantiated", function () {
            it("should create a new  contract address", async () => {
                expect(PaymentSplitterInstance.address);
              
            });

        });
    });

    describe("totalShares", () => {
        describe("when the PaymentSplitter contract is instantiated then TotalShare pecentage ", function () {
            it("total share should be 100", async () => {
                let tShare = parseInt(await (PaymentSplitterInstance.totalShares({ from: owner })));
              
                expect(tShare == 100);
               
                
            });

        });
    });

    describe("shares", () => {
        it("should return the share of particular  addres", async () => {
            let userShare = parseInt(await (PaymentSplitterInstance.shares(USERADDRESS[0], { from: owner })));
          
            expect(parseInt(await (PaymentSplitterInstance.shares(USERADDRESS[0], { from: owner })))).to.equal(USERSHARE[0]);

        });

    });
    describe("pay", () => {
        describe("when the PaymentSplitter contract get ethers", function () {
            it("should send the ethers to contract", async () => {
                let pay = await PaymentSplitterInstance.pay({ from: owner, value: sendAmt });
                await expectEvent(pay, EventNames.PaymentReceived, {
                    from: owner,
                    amount: sendAmt
                });
               
            });

        });
    });

    describe("releasable", () => {
        describe("when payee tries to check how much ammout to be releasable", function () {
            it("should return the releasable ammount", async () => {
                let releasableAmt = await PaymentSplitterInstance.releasable(user);
         
                expect( parseInt(await PaymentSplitterInstance.releasable(user))).to.equal(user1Releasable);
            });

        });
    });

    describe("release", () => {
        describe("when payee tries to release their amount", function () {
            it("should release the amount to payee", async () => {
                let releasablePayment = await PaymentSplitterInstance.releasable(user);
                let payment = (releasablePayment * percentage) / 100;
                let released = await PaymentSplitterInstance.release({ from: user });
                await expectEvent(released, EventNames.PaymentReleased, {
                    to: user,
                   amount:payment.toString()


                })
            });

        });
        describe("when user tries to release ether early", function () {
            it("should not release", async () => {
                await expectRevert(PaymentSplitterInstance.release({ from: user }),
                    "PaymentSplitter:early withdraw request"
                );

            })
        })

        describe("when user tries to release ether after UnlockTime", function () {
            it("should release", async () => {
                await sleep(10000);
                let releasablePayment = await PaymentSplitterInstance.releasable(user);
              
                let payment = (releasablePayment * percentage) / 100;
               
                let released = await PaymentSplitterInstance.release({ from: user });

                await expectEvent(released, EventNames.PaymentReleased, {
                    to: user,
                    amount: payment.toString()

                })
            })
        })

        describe("when non-payees user tries to release", function () {
            it("should not release for non-payee", async () => {
                await expectRevert(PaymentSplitterInstance.release({ from: blackListUser }),
                    "PaymentSplitter: You don't have share"
                );

            })
        })

        describe("when non-payees user tries to release", function () {
            it("should not release for non-payee", async () => {
                await expectRevert(PaymentSplitterInstance.release({ from: blackListUser }),
                    "PaymentSplitter: You don't have share"
                );

            })
        })

    });
    describe("getContractbalance",function(){
        describe("tries to fetch contract balance", function () {
            it("should return the contract balance", async () => {
               let balance= await web3.eth.getBalance(PaymentSplitterInstance.address);
             
               balance=parseInt(balance);
                expect(parseInt(await PaymentSplitterInstance.getContractbalance())).to.equal(balance);
            })
        })

    })

    describe("payee",function(){
        describe("tries to fetch payee address via index value ", function () {
            it("should return the payee address", async () => {
                expect((await PaymentSplitterInstance.payee(0)).toString()).to.equal(USERADDRESS[0]);
            })
        })

    })
    


});
