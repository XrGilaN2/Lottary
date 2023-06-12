// Check if Metamask is installed and enabled
if (typeof window.ethereum !== 'undefined') {
    // Access the user's address
    ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
            if (accounts.length > 0) {
                // Display the address in the HTML element
                const walletAddressElement = document.getElementById('currentAddress');
                walletAddressElement.value = accounts[0];
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
