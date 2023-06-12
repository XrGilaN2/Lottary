const contractOwnerElement = document.getElementById('ownerAddress');

// Retrieve the address of the contract owner
ethereum.request({ method: 'eth_call', params: [{ to: '0xContractAddress', data: '0x8da5cb5b' }, 'latest'] })
  .then((result) => {
    // Remove the '0x' prefix and set the address as the value of the input field
    const address = result.substring(2);
    contractOwnerElement.value = address;
  })
  .catch((error) => {
    console.error(error);
  });
