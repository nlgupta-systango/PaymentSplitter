const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectEvent, // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    time,
} = require("@openzeppelin/test-helpers");

const { fromWei, toWei } = require("web3-utils");
const keccak256 = require("keccak256");
const RolaCoaster = artifacts.require("RolaCoaster");
const RolaGame = artifacts.require("RolaGame");

contract("RolaGame", (accounts) => {

    const EventNames = {
        BetBear: "BetBear",
        BetBull: "BetBull",
        Claim: "Claim",
        LockRound: "LockRound",
        EndRound: "EndRound",
        NewAdminAddress: "NewAdminAddress",
        NewBufferSeconds: "NewBufferSeconds",
        NewMinBetAmount: "NewMinBetAmount",
        NewTreasuryFee: "NewTreasuryFee",
        NewOperatorAddress: "NewOperatorAddress",
        RewardsCalculated: "RewardsCalculated",
        StartRound: "StartRound",
        TokenRecovery: "TokenRecovery",
        TreasuryClaim: "TreasuryClaim",
        Paused: "Paused",
        Unpaused: "Unpaused",
    };

    const [owner, user, bob, steve, blackListUser, george, nonWhiteListUser] = accounts;

    const name = "RolaGame";
    const symbol = "RG";
    const bufferTime = 45;
    const minBetAmt = 100;
    const treasuryFee = 10;
    const roundID=1;
    const mintToken=5000;
    const betToken=300;
    const newBuffer=33;
    const newTreasuryFee=30;
    const maintainerAddress = bob;
    const NewOperator = george;
    const newAdmin = steve;
    const treasuryAddress = steve;
    const wrongRoundid=0;
    const dexAddress = '0x6eF026fC19F36E0747AAFDA652731Ce05441C4C1';
    const zeroAddress='0x0000000000000000000000000000000000000000';
    let roundTime = 8;
    let newMinBetAmount=150;
    const baseURI1 = "https://ipfs.io/ipfs/QmT5LTjW2oenEF3tSDQreSGtMfwxTw6SQbf3tSER1BLx2Z/";
    const baseURI2 = "http://google.co.in/";
    const mintPrice = toWei("0.001", "ether");
    const newMintPrice = toWei("0.1", "ether");
    const incorrectWithdrawBalance = toWei("1", "ether");
    const nullBytes = "0x";
    const nxtRound=roundID+1;
    let currentTime = Math.floor((new Date() / 1000));
    let RolaGameInstance = null;
    let RolaCoasterInstance = null;
    async function initContracts() {
        RolaCoasterInstance = await RolaCoaster.new("RolaToken", "RC", 8, bob, owner, { from: owner });
        RolaGameInstance = await RolaGame.new(owner, bob, RolaCoasterInstance.address, bufferTime, minBetAmt, treasuryFee, { from: owner });
    }
    before("Deploy new RolaGame", async () => {
        await initContracts();
    });

    const delay = ms => new Promise(res => setTimeout(res, ms));

    describe("Initial State", () => {
        describe("when RolaGame contract is instantiated", function () {
            it("has a admin", async function () {
                expect(await RolaGameInstance.adminAddress()).to.equal(owner);
            });

            it("has a operator", async function () {
                expect(await RolaGameInstance.operatorAddress()).to.equal(bob);
            });

            it("has a rolaAddress", async function () {
                expect(await RolaGameInstance.rolaAddress()).to.equal(RolaCoasterInstance.address);
            });

            it("has a min bet ammount", async function () {
                expect(parseInt(await RolaGameInstance.minBetAmount())).to.equal(minBetAmt);
            });


            it("should create a new  contract address", async () => {
                expect(RolaGameInstance.address);
            });

        });
    });

    describe("genesisStartRound", async () => {

        describe("when operator tries to start", async () => {
            it("should start the genesis Round ", async () => {

                await RolaGameInstance.genesisStartRound(dexAddress, roundID, currentTime, roundTime, { from: bob });
                await expectRevert(
                    RolaGameInstance.genesisStartRound(dexAddress, roundID, currentTime, roundTime, { from: bob },),
                    "Can only run genesisStartRound once"
                );
            });
        });

        describe("when operator re-try to start same round", async () => {
            it("should not start the round ", async () => {
                await expectRevert(
                    RolaGameInstance.genesisStartRound(dexAddress, roundID, currentTime, roundTime, { from: bob },),
                    "Can only run genesisStartRound once"
                );
            });
        });

        describe("when other tries to start", async () => {
            it("should not start the genesis Round ", async () => {
                await expectRevert(
                    RolaGameInstance.genesisStartRound(dexAddress, roundID, currentTime, roundTime, { from: user },),
                    "Not operator"
                );
            });
        });
    });

    describe("betBear", () => {
        describe("when user tries to Bet on bear", function () {
            it("should not place the user bet on bear", async () => {
                await expectRevert(
                    RolaGameInstance.betBear(roundID, betToken, { from: user }),
                    "Insufficient ROLA tokens"
                );
            });
        });

        describe("when user tries to bet on bear with less token ", function () {
            it("should not place the user bet on bull", async () => {
                await RolaCoasterInstance.mintRola(george, mintToken, { from: bob },);
                await RolaCoasterInstance.setApprovalForAll(RolaGameInstance.address, true, { from: george });
                await expectRevert(
                    RolaGameInstance.betBear(roundID, 1, { from: george }),
                    "Bet amount must be greater than minBetAmount"
                );
            });
        });

        describe("when user tries to Bet on bear", function () {
            it("should place the user bet on bear", async () => {
                let betReciept = await RolaGameInstance.betBear(roundID, betToken, { from: george });
                await expectEvent(betReciept, EventNames.BetBear, {
                    sender:george,
                    epoch:new BN(roundID),
                    amount:new BN(betToken)
                });

            });
        });

       
    

        describe("when user give wrong round ID to Bet on Bear", function () {
            it("should not place the user bet on Bear", async () => {
                await expectRevert(
                    RolaGameInstance.betBear(wrongRoundid, betToken, { from: george }),
                    "Round not bettable"
                );
            });
        });

        describe("when user tries to bet Bear again on same Round", function () {
            it("should not place the user bet on bull", async () => {
                await expectRevert(
                    RolaGameInstance.betBear(roundID, betToken, { from: george }),
                    "Can only bet once per round"
                );
            });
        });
     

    });



    describe("betBull", () => {
        describe("when user tries to Bet on Bull", function () {
            it("should not place the user bet on bull", async () => {
                await expectRevert(
                    RolaGameInstance.betBull(roundID, betToken, { from: user }),
                    "Insufficient ROLA tokens"
                );
            });
        });

        describe("when user tries to bet on bull with less token ", function () {
            it("should not place the user bet on bull", async () => {
                await RolaCoasterInstance.mintRola(user, mintToken, { from: bob },);
                await RolaCoasterInstance.setApprovalForAll(RolaGameInstance.address, true, { from: user });
                await expectRevert(
                    RolaGameInstance.betBull(roundID, 1, { from: user }),
                    "Bet amount must be greater than minBetAmount"
                );
            });
        });

        describe("when user tries to Bet on Bull", function () {
            it("should place the user bet on bull", async () => {
                // await RolaCoasterInstance.mintRola(user, mintToken, { from: bob },);
                // await RolaCoasterInstance.setApprovalForAll(RolaGameInstance.address, true, { from: user });
                let betReciept = await RolaGameInstance.betBull(roundID, betToken, { from: user });
                await expectEvent(betReciept, EventNames.BetBull, {
                    sender:user,
                    epoch:new BN(roundID),
                    amount:new BN(betToken)
                });

            });
        });

        describe("when user give wrong round ID to Bet on Bull", function () {
            it("should not place the user bet on bull", async () => {
                await expectRevert(
                    RolaGameInstance.betBull(wrongRoundid, betToken, { from: user }),
                    "Round not bettable"
                );
            });
        });

        describe("when user tries to bet bull again on same Round", function () {
            it("should not place the user bet on bull", async () => {
                await expectRevert(
                    RolaGameInstance.betBull(roundID, betToken, { from: user }),
                    "Can only bet once per round"
                );
            });
        });
     

    });

    describe("genesisLockRound", async () => {
        describe("when operator tries to lock the round before genesis start", async () => {
            it("should not lock the genesis Round ", async () => {
            //  await RolaGameInstance.genesisLockRound(dexAddress, nxtRound, currentTime, roundTime, roundID, { from: bob });
               await expectRevert(
                RolaGameInstance.genesisLockRound(dexAddress, nxtRound, currentTime, roundTime, 10+roundID, { from: bob }),
                "Can only run after genesisStartRound is triggered"
            );
            });
        });
        describe("when operator tries to lock the round after execution time", async () => {
            it("should lock the genesis Round ", async () => {
               await delay(9000);
               await expect(RolaGameInstance.genesisLockRound(dexAddress, nxtRound, currentTime, roundTime, roundID, { from: bob }));
            });
        });
    });
    describe("when user claim", function () {
        it("should claim ", async () => {
            delay(10000);
            let claimR = await RolaGameInstance.claim([roundID],{ from: george });
            await expectEvent(claimR, EventNames.Claim, {
                // sender:george,
                // epoch:new BN(roundID),
                // amount:new BN(betToken)
            });

        });
    });



    describe("executeRound", () => {
        

        describe("when non operator tries to execute the Round", async () => {
            it("should not execute Round", async () => {
                let newRid=nxtRound+1;
                let currentTime2 = Math.floor((new Date() / 1000));
                await RolaGameInstance.executeRound(dexAddress,newRid,currentTime2,roundTime,nxtRound,roundID,{ from: bob});
                

                // await expectRevert(
                //     RolaGameInstance.executeRound(dexAddress,newRid,currentTime2,roundTime,nxtRound,roundID,{ from: bob}),
                //     "Not operator"
                // );//address deskAddress, uint256 roundId, uint256 startRoundTime, uint256 roundExecutionTime, uint256 preroundId, uint256 endroundId
            });
        });
    });


    // Can only lock round after lockTimestamp

    describe("claimTreasury", () => {
        
        describe("when non admin tries to claim the Treasury", async () => {
            it("should not be claim", async () => {
                await expectRevert(
                    RolaGameInstance.claimTreasury({ from: user}),
                    "Not admin"
                );
            });
        });

        describe("when Admin tries to claim Treasury", async () => {
            it("should withdraw or claim the Treasury ", async () => {
                let TreasuryReward=await RolaGameInstance.treasuryAmount();
                const claimReceipt = await RolaGameInstance.claimTreasury({ from: owner});
                await expectEvent(claimReceipt, EventNames.TreasuryClaim, {
                    amount:new BN(TreasuryReward)
                });
            });
        });
    });


    describe("pause", () => {
        describe("when other user tries to pause contract", function () {
            it("should not pause contract", async () => {
                // expect(await RolaGameInstance.paused()).to.equal(false);
                await expectRevert(
                    RolaGameInstance.pause({
                        from: user,
                    }),
                    "Not operator/admin"
                );
            });
        });

        describe("when owner tries to pause contract", function () {
            it("should pause contract", async () => {

                const pauseReceipt = await RolaGameInstance.pause({
                    from: owner,
                });
                await expectEvent(pauseReceipt, EventNames.Paused, {
                    account: owner,
                });
            });
        });
    });

    describe("setBufferTime", async () => {

        it("should not set the new BufferTime as new Buffer time zero passed", async () => {
            const setReceipt = await RolaGameInstance.setBufferTime(bufferTime, { from: owner });

            await expectRevert(
                RolaGameInstance.setBufferTime(0, { from: owner }),
                "bufferSeconds must be superior to 0"
            );
        });

        it("should set the new BufferTime", async () => {
            const setReceipt = await RolaGameInstance.setBufferTime(newBuffer, { from: owner });

            await expectEvent(setReceipt, EventNames.NewBufferSeconds, {
                bufferSeconds:new BN(newBuffer)
            });
        });

        describe("when non admin tries to set new BufferTime", async () => {
            it("should not set the new BufferTime", async () => {
                await expectRevert(
                    RolaGameInstance.setBufferTime(bufferTime, { from: user }),
                    "Not admin"
                );
            });
        });

    });

    describe("setMinBetAmount", async () => {

        it("should not set the  Min. Bet Amount as Amount equal to zero", async () => {

            await expectRevert(
                RolaGameInstance.setMinBetAmount(0, { from: owner }),
                "minBetAmount must be superior to 0"
            );
        });

        it("should set the Min. Bet Amount", async () => {
            const setReceipt = await RolaGameInstance.setMinBetAmount(newMinBetAmount, { from: owner });

            await expectEvent(setReceipt, EventNames.NewMinBetAmount, {
                minBetAmount:new BN(newMinBetAmount)
            });
        });

        describe("when non admin tries to set Min Bet Amount", async () => {
            it("should not set the new Min Bet Amount", async () => {
                await expectRevert(
                    RolaGameInstance.setMinBetAmount(newMinBetAmount, { from: user }),
                    "Not admin"
                );
            });
        });

    });

    describe("setOperator", async () => {

        it("should set the new operator Address", async () => {
            const setReceipt = await RolaGameInstance.setOperator(NewOperator, { from: owner });

            await expectEvent(setReceipt, EventNames.NewOperatorAddress, {
                operator:NewOperator
            });
        });

        it("should not set the new operator Address", async () => {
            await expectRevert(
                RolaGameInstance.setOperator(NewOperator, { from: user }),
                "Not admin"
            );
        });
    });

    describe("setTreasuryFee", async () => {
        describe("when treasury fees is too high",()=>{
            it("should not set mint amount", async () => {
                let maxTFes= await RolaGameInstance.MAX_TREASURY_FEE();
                await expectRevert(
                    RolaGameInstance.setTreasuryFee(maxTFes+1, {
                        from: owner,
                    }),
                    "Treasury fee too high"
                );
            });

        });

        it("should set the new Treasury Fee", async () => {
            const setReceipt = await RolaGameInstance.setTreasuryFee(newTreasuryFee, { from: owner });

            await expectEvent(setReceipt, EventNames.NewTreasuryFee, {
                treasuryFee:new BN(newTreasuryFee)
            });
        });

        it("should not set the new admin Address", async () => {
            await expectRevert(
                RolaGameInstance.setTreasuryFee(newTreasuryFee, { from: user }),
                "Not admin"
            );
        });
    });

    describe("setAdmin", async () => {
        describe("when owner tries to set zero address as new admin", function () {
            it("should not set zero address", async () => {
                await expectRevert(
                    RolaGameInstance.setAdmin(zeroAddress,{
                        from: owner,
                    }),
                    "Cannot be zero address"
                );
            });
        });

        it("should set the new admin Address", async () => {
            const setReceipt = await RolaGameInstance.setAdmin(newAdmin, { from: owner });

            await expectEvent(setReceipt, EventNames.NewAdminAddress, {
                admin:newAdmin
            });
        });

        it("should not set the new admin Address", async () => {
            await expectRevert(
                RolaGameInstance.setOperator(newAdmin, { from: user }),
                "Not admin"
            );
        });
    });


    describe("unpause", () => {
        describe("when Non-admin tries to unpause contract", function () {
            it("should not unpause contract", async () => {
                await expectRevert(
                    RolaGameInstance.unpause({
                        from: user,
                    }),
                    "Not admin"
                );
            });
        });

        describe("when Admin tries to unpause contract", function () {
            it("should unpause contract", async () => {
               
                const pauseReceipt = await RolaGameInstance.unpause({
                    from: newAdmin,
                });
                await expectEvent(pauseReceipt, EventNames.Unpaused, {
                    account: newAdmin,
                });
              
            });
        });
    });


});
