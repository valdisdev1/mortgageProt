// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealEstateNFT is ERC721URIStorage, Ownable {
    uint256 public tokenIdCounter;

    struct RealEstateMetadata {
        string propertyAddress;
        uint256 bedrooms;
        uint256 bathrooms;
        uint256 appraisedValue;
        string valuationDocumentHash;
        string imageHash;
    }

    mapping(uint256 => RealEstateMetadata) public realEstateData;

    event RealEstateMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string propertyAddress,
        uint256 appraisedValue
    );

    constructor() ERC721("Real Estate NFT", "RENFT") Ownable(msg.sender) {}

    function mintRealEstate(
        string memory propertyAddress,
        uint256 bedrooms,
        uint256 bathrooms,
        uint256 appraisedValue,
        string memory valuationDocumentHash,
        string memory imageHash
    ) public returns (uint256) {
        require(bytes(propertyAddress).length > 0, "Property address cannot be empty");
        require(appraisedValue > 0, "Appraised value must be greater than 0");

        tokenIdCounter++;
        uint256 newTokenId = tokenIdCounter;

        _safeMint(msg.sender, newTokenId);
        
        // Create metadata URI using the image hash
        string memory tokenURI = string(abi.encodePacked("ipfs://", imageHash));
        _setTokenURI(newTokenId, tokenURI);

        realEstateData[newTokenId] = RealEstateMetadata(
            propertyAddress,
            bedrooms,
            bathrooms,
            appraisedValue,
            valuationDocumentHash,
            imageHash
        );

        emit RealEstateMinted(newTokenId, msg.sender, propertyAddress, appraisedValue);

        return newTokenId;
    }

    function getRealEstateData(uint256 tokenId) public view returns (RealEstateMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return realEstateData[tokenId];
    }

    function getAllProperties() public view returns (RealEstateMetadata[] memory) {
        RealEstateMetadata[] memory allProperties = new RealEstateMetadata[](tokenIdCounter);
        for (uint256 i = 1; i <= tokenIdCounter; i++) {
            if (_ownerOf(i) != address(0)) {
                allProperties[i - 1] = realEstateData[i];
            }
        }
        return allProperties;
    }

    function totalSupply() public view returns (uint256) {
        return tokenIdCounter;
    }
} 