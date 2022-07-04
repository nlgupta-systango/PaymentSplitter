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

contract("RolaCoaster", (accounts) => {

    const EventNames = {
        NewMaintainAddressSet: "NewMaintainAddressSet",
        NewTreasuryAddressSet: "NewTreasuryAddressSet",
        RolaMinted: "RolaMinted",
        InitializeRolaGramMint: "InitializeRolaGramMint",
        NewRolaGramMinted: "NewRolaGramMinted",

    };

    const [owner, user, bob, steve, blackListUser, george, nonWhiteListUser] = accounts;

    const name = "RolaCoaster";
    const symbol = "RC";
    const decimalsRola = 8;
    const maintainerAddress = bob;
    const treasuryAddress = steve;
    const baseURI1 = "https://ipfs.io/ipfs/QmT5LTjW2oenEF3tSDQreSGtMfwxTw6SQbf3tSER1BLx2Z/";
    const baseURI2 = "http://google.co.in/";
    const mintPrice = toWei("0.001", "ether");
    const newMintPrice = toWei("0.1", "ether");
    const incorrectWithdrawBalance = toWei("1", "ether");
    const nullBytes = "0x";
    let total = 0;
    let tokenId = 0;
    let MintAmount = 5;
    let mintEndTime = Math.floor((new Date() / 1000) + 1000);
    let newMintEndTime = Math.floor((new Date() / 1000));
    let RolaCoasterInstance = null;

    async function initContract() {
        RolaCoasterInstance = await RolaCoaster.new(name, symbol, decimalsRola, maintainerAddress, treasuryAddress, { from: owner });
    }

    before("Deploy new Woof Gang Token Contract", async () => {
        await initContract();
    });

    describe("Initial State", () => {
        describe("when the woof gang contract is instantiated", function () {
            it("has a name", async function () {
                expect(await RolaCoasterInstance.name()).to.equal(name);
            });

            it("has a symbol", async function () {
                expect(await RolaCoasterInstance.symbol()).to.equal(symbol);
            });

            it("should create a new  contract address", async () => {
                expect(RolaCoasterInstance.address);
                console.log(RolaCoasterInstance.address);
            });

        });
    });

    describe("getTreasuryAddress", async () => {

        it("should return the Treasury Address", async () => {
            expect(await RolaCoasterInstance.getTreasuryAddress()).to.equal(treasuryAddress);
            console.log(steve);
            console.log(await RolaCoasterInstance.getTreasuryAddress());
        });


    });

    describe("getRolaDecimals", async () => {

        it("should return the Rola Decimals", async () => {
            expect(parseInt(await RolaCoasterInstance.getRolaDecimals())).to.equal(decimalsRola);
            
        });
    });

    describe("getMaintainerAddress", async () => {

        it("should return the Maintainer Address", async () => {
            expect(await RolaCoasterInstance.getMaintainerAddress()).to.equal(maintainerAddress);
            
        });
    });

    describe("getMaintainerAddress", async () => {

        it("should return the Maintainer Address", async () => {
            expect(await RolaCoasterInstance.getMaintainerAddress()).to.equal(maintainerAddress);
            
        });
    });




});
