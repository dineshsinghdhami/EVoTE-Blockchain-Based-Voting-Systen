const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {

  it("should deploy the Voting contract successfully", async function () {
    const Voting =
      await ethers.getContractFactory("Voting");

    const voting = await Voting.deploy(
      "Super Admin",
      946684800,
      ethers.ZeroAddress
    );

    await voting.waitForDeployment();

    const contractAddress =
      await voting.getAddress();

    expect(contractAddress)
      .to.not.equal(ethers.ZeroAddress);
  });


  it("should assign the deployer as super admin", async function () {
    const [owner] =
      await ethers.getSigners();

    const Voting =
      await ethers.getContractFactory("Voting");

    const voting = await Voting.deploy(
      "Super Admin",
      946684800,
      ethers.ZeroAddress
    );

    await voting.waitForDeployment();

    const user =
      await voting.users(owner.address);

    expect(user.role).to.equal(3n);
  });


  it(
    "should prevent a normal user from creating an institution",
    async function () {
      const [owner, normalUser] =
        await ethers.getSigners();

      const Voting =
        await ethers.getContractFactory("Voting");

      const voting = await Voting.deploy(
        "Super Admin",
        946684800,
        ethers.ZeroAddress
      );

      await voting.waitForDeployment();

      let failed = false;

      try {
        await voting
          .connect(normalUser)
          .createInstitution(
            "Test Institution"
          );
      } catch (error) {
        failed = true;
      }

      expect(failed).to.equal(true);
    }
  );


  it(
    "should prevent an unregistered user from voting",
    async function () {
      const [owner, normalUser] =
        await ethers.getSigners();

      const Voting =
        await ethers.getContractFactory("Voting");

      const voting = await Voting.deploy(
        "Super Admin",
        946684800,
        ethers.ZeroAddress
      );

      await voting.waitForDeployment();

      let failed = false;

      try {
        await voting
          .connect(normalUser)
          .vote(1, 1, 1, 1);
      } catch (error) {
        failed = true;
      }

      expect(failed).to.equal(true);
    }
  );

});