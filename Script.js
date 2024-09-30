// Global notification function
function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.textContent = message;

    document.body.appendChild(notificationDiv);

    setTimeout(() => {
        notificationDiv.classList.add('show');
    }, 100); // Ensure the notification is added to the DOM

    setTimeout(() => {
        notificationDiv.classList.remove('show');
        notificationDiv.classList.add('hidden');
        setTimeout(() => notificationDiv.remove(), 500);
    }, 7000);
}

// Global variable to temporarily hold the token
let currentToken = null;

document.addEventListener('DOMContentLoaded', async function () {
    displayClients();
    showSection('home'); // Show the home section by default on page load
    shiftSectionsAutomatically(); // Start shifting through sections automatically
    checkServerLoginStatus();// Check if the user is logged in by making a server request
    
    // Event listener for login
document.getElementById('login-form')?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Store the token temporarily
            currentToken = data.token; 
            const expiresAt = data.expiresAt;

            console.log('Token stored successfully on the server.');
            showNotification(`Login successful! Welcome, ${data.username}.`, 'success');

            // Redirect to the home section
            toggleForms(true);
            showSection('home');

            // Clear input fields
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        } else {
            // Handle specific error messages from the server
            showNotification(data.message || 'Invalid username or password. Please try again.', 'error');
        }
       } catch (error) {
        console.error('Error:', error);
        showNotification('There was an error with your login. Please try again.', 'error');
      }
});

    // Event listener for logout
    document.getElementById('logout-link')?.addEventListener('click', async function (event) {
        event.preventDefault();

        if (!currentToken) {
            showNotification('You are not logged in.', 'error');
            return;
        }

        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}` } // Include the token in the header
            });

            if (response.ok) {
                showNotification('You have been logged out.', 'success');
                toggleForms(false);
                showSection('home');
                currentToken = null; // Clear the token after logout
            } else {
                const data = await response.json();
                showNotification(data.message || 'Logout failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showNotification('There was an issue logging out. Please try again.', 'error');
        }
    });

        
    // Function to check login status
async function checkServerLoginStatus() {
    try {
        const response = await fetch('/check-token', {
            method: 'GET',
            credentials: 'include' 
        });

        if (response.ok) {
            const data = await response.json();
            // If token is valid, update UI accordingly
            if (data.valid) {
                showNotification(`Welcome back, ${data.username}!`, 'success');
                toggleForms(true); // Show logged-in state
                showSection('home'); // Redirect to home
            } else {
                toggleForms(false); // Show logged-out state
                showSection('login'); // Redirect to login
            }
        } else {
            console.error('Failed to check login status:', response.status);
            toggleForms(false); // Ensure UI reflects logged-out state
            showSection('login'); // Redirect to login if there's an error
        }
    } catch (error) {
        console.error('Error checking token:', error);
    }
}
});

    // Re-Authentication
    document.getElementById('reauth-form')?.addEventListener('submit', async function (event) {
        event.preventDefault();
    
        const email = document.getElementById('reauth-email').value;
        const password = document.getElementById('reauth-password').value;
    
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await response.json();
    
            if (response.ok && data.success) {
                showNotification('Re-authentication successful!', 'success');
                toggleForms(true);
                window.location.hash = '#home';
                showSection('home');
            } else {
                showNotification('Re-authentication failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during re-authentication:', error);
            showNotification('There was an error during re-authentication. Please try again.', 'error');
        }
    });
    
    // Event listener for register form submission
    document.getElementById('register-form')?.addEventListener('submit', async function (event) {
        event.preventDefault();

        const username = document.getElementById('register-username').value;
        const phone_number = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const email = document.getElementById('register-email').value;

        if (!username || !phone_number|| !password || !email) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, phone_number, password, email }),
            });

            if (response.ok) {
                showNotification('Registration successful!', 'success');
                window.location.hash = '#login';
                showSection('login');
            } else {
                const errorData = await response.json();
                showNotification(errorData.error || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('There was an error with your registration. Please try again.', 'error');
        }
    });

    // Function to dynamically update client list (for demonstration purposes)
    function displayClients() {
        const clients = [
            { name: 'Client A', project: 'Web Development' },
            { name: 'Client B', project: 'Mobile Development' },
        ];

        const clientList = document.getElementById('client-list');
        if (clientList) {
            clientList.innerHTML = '';
            clients.forEach(client => {
                const clientDiv = document.createElement('div');
                clientDiv.textContent = `${client.name}: ${client.project}`;
                clientList.appendChild(clientDiv);
            });
        }
    }

    // Function to toggle form visibility based on login status
    function toggleForms(isLoggedIn) {
        const bookingSection = document.getElementById('booking');
        const loginOptions = document.getElementById('register-link');
        const logoutSection = document.getElementById('logout-link');

        if (isLoggedIn) {
            bookingSection?.classList.remove('hidden');
            loginOptions?.classList.add('hidden');
            logoutSection?.classList.remove('hidden');
        } else {
            bookingSection?.classList.add('hidden');
            loginOptions?.classList.remove('hidden');
            logoutSection?.classList.add('hidden');
        }
    }

    // Function to shift sections automatically every 5 seconds
    function shiftSectionsAutomatically() {
        const links = document.querySelectorAll('header nav ul li a');
        let currentIndex = 0;
        const intervalId = setInterval(() => {
            if (currentIndex >= links.length) {
                currentIndex = 0;
            }
            const sectionId = links[currentIndex].getAttribute('href').substring(1);
            showSection(sectionId);
            currentIndex++;
        }, 5000);

        document.addEventListener('click', function (event) {
            if (event.target.tagName === 'A') {
                clearInterval(intervalId);
            }
        });
    }

    const bookingForm = document.getElementById('booking-form');

// Function to check login status by querying the server for the token status
async function checkServerLoginStatus() {
    try {
        const response = await fetch('/check-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken || ''}`, // Ensure currentToken is defined
            },
            credentials: 'include' // Include cookies for session management if necessary
        });

        if (response.ok) {
            const data = await response.json();
            return data.valid; // Assuming the endpoint returns { valid: true/false }
        } else {
            console.error('Failed to check login status:', response.status, response.statusText);
            return false; // Return false if the request failed
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        return false; // Return false on error
    }
}

// Function to check login status and show the appropriate section
async function checkLogin(section) {
    const isLoggedIn = await checkServerLoginStatus();

    if (isLoggedIn) {
        // If logged in, show the requested section
        showSection(section);
    } else {
        // If not logged in, show a notification
        showNotification('Please log in first to access this section.', 'error');
        showSection('login'); // Redirect to login
    }
}


// Function to navigate between booking steps
document.addEventListener('DOMContentLoaded', () => {
    // Function to move to a specific step
    function goToStep(stepNumber) {
        const currentStep = document.querySelector('.step.active');
        const nextStep = document.querySelector(`#step-${stepNumber}`);

        if (currentStep) {
            currentStep.classList.add('hidden');
            currentStep.classList.remove('active');
        }

        if (nextStep && nextStep.classList.contains('step')) {
            nextStep.classList.remove('hidden');
            nextStep.classList.add('active');
        } else {
            console.error("Step not found or invalid.");
        }
    }

    // Function to handle the "Previous" button click
    function handlePreviousClick() {
        goToStep(1);
    }

    // Attach event listeners to the buttons
    const prevBtn = document.getElementById('prevBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', handlePreviousClick);
    } else {
        console.error('Previous button not found.');
    }
    const bookingForm = document.getElementById('booking-form');
// Handle form submission for booking
if (bookingForm) {
    // Form submission event listener
    bookingForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission behavior

        // Collect form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone_number = document.getElementById('phone_number').value;
        const gender = document.getElementById('gender').value;
        const service = document.getElementById('service').value;
        const details = document.getElementById('details').value;

        // Disable the form to prevent multiple submissions
        bookingForm.querySelector('button[type="submit"]').disabled = true;

        try {
            // Submit form data to the server
            const response = await fetch('/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken || ''}`, // Include token if available
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone_number,
                    gender,
                    service,
                    details,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const bookingId = data.booking_id; // Get the booking ID from the server response
                storeBookingId(bookingId); // Store the booking ID
                showNotification(`Thank you ${name} for booking a ${service} service! We will contact you at ${email}.`, 'success');
                
                // Reset the form
                bookingForm.reset();

                // Automatically move to Step 2 after booking is done
                goToStep(2); 
            } else {
                throw new Error(data.message || 'An error occurred during booking.'); // Handle server-side errors
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('There was an error with your booking. Please try again.', 'error');
        } finally {
            // Re-enable the submit button regardless of success or failure
            bookingForm.querySelector('button[type="submit"]').disabled = false;
        }
    });
}
});

// Function to store the booking ID in session/local storage or as a global variable
function storeBookingId(bookingId) {
    sessionStorage.setItem('bookingId', bookingId); // Store in session storage for temporary use
}

// Function to retrieve the booking ID
function getBookingId() {
    return sessionStorage.getItem('bookingId'); // Retrieve from session storage
}

    document.addEventListener('DOMContentLoaded', function() {
        // Get the current booking step from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking_id'); // Get booking_id from the URL
    
        if (bookingId) {
            // Automatically navigate to Step 2 if booking_id exists
            goToStep(2);
        }

});

 // Function to check login status by querying the server for the token status
async function checkServerLoginStatus() {
    try {
        const response = await fetch('/check-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken || ''}`, // Ensure currentToken is defined
            },
            credentials: 'include' // Include cookies for session management if necessary
        });

        if (response.ok) {
            const data = await response.json();
            return data.valid; // Assuming the endpoint returns { valid: true/false }
        } else {
            console.error('Failed to check login status:', response.status, response.statusText);
            return false; // Return false if the request failed
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        return false; // Return false on error
    }
}

// Function to check login status and show the appropriate section
async function checkLogin(section) {
    const isLoggedIn = await checkServerLoginStatus();

    if (isLoggedIn) {
        // If logged in, show the requested section
        showSection(section);
    } else {
        // If not logged in, show a notification
        showNotification('Please log in first to Book with Us.', 'error');
        showSection('login'); // Redirect to login
    }
}

// Handle form submission for enquiries
document.getElementById('enquiries-form')?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = document.getElementById('enquiry-name').value;
    const phone_number = document.getElementById('enquiry-phone').value;
    const email = document.getElementById('enquiry-email').value;
    const message = document.getElementById('enquiry-message').value;

    try {
        const response = await fetch('/enquiries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, phone_number, email, message }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error:', errorText);
            throw new Error(errorText || 'Network response was not ok');
        }

        const result = await response.json();
        showNotification(`Thank you ${name} for your enquiry! We will respond to you at ${email}.`, 'success');
        document.getElementById('enquiries-form').reset();
    } catch (error) {
        console.error('Error:', error);
        showNotification('There was an error with your enquiry. Please try again.', 'error');
    }
});


// Function to show login options
function showLoginOptions(option) {
    const login = document.getElementById('login');
    const register = document.getElementById('register');

    login.classList.add('hidden');
    register.classList.add('hidden');

    if (option === 'login') {
        login.classList.remove('hidden');
    } else if (option === 'register') {
        register.classList.remove('hidden');
    }
}

// Function to handle section visibility
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));

    // Show the selected section
    const sectionToShow = document.getElementById(sectionId);
    sectionToShow?.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
    showSection('home');  // Show the home section by default on page load
    shiftSectionsAutomatically();  // Start shifting through sections automatically
    checkServerLoginStatus();
});


// Helper functions to show and hide loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Function to handle payment submission
async function submitPayment() {
    console.log("submitPayment function called");
    const paymentMethod = document.getElementById('payment-method').value;

    // Show loader
    showLoader();

    try {
        switch (paymentMethod) {
            case 'credit-card':
                const cardNumber = document.getElementById('card-number').value;
                const cardExpiry = document.getElementById('card-expiry').value;
                const cardCvc = document.getElementById('card-cvc').value;
                if (!cardNumber || !cardExpiry || !cardCvc) {
                    showNotification('Please provide all required credit card details.', 'error');
                    return;
                }
                await saveCreditCardPayment({ cardNumber, cardExpiry, cardCvc });
                break;

            case 'paypal':
                const paymentEmail = document.getElementById('payment-email').value;
                const transactionId = document.getElementById('transaction-id').value;
                if (!paymentEmail || !transactionId) {
                    showNotification('Please provide all required PayPal details.', 'error');
                    return;
                }
                await savePayPalPayment({ paymentEmail, transactionId });
                break;

            case 'bank-transfer':
                const bankName = document.getElementById('bank-name').value;
                const accountNumber = document.getElementById('account-number').value;
                const phoneNumber = document.getElementById('phone-number').value;
                const transactionCode = document.getElementById('transactions-code').value;

                
                if (!bankName || !accountNumber  || !phoneNumber || !transactionCode ) {
                    showNotification('Please provide all required bank transfer details.', 'error');
                    return;
                }
                await saveBankTransferPayment({ bankName, accountNumber, phoneNumber, transactionCode });
                break;

            case 'mpesa':
                const mpesaNumber = document.getElementById('mpesa-number').value;
                const mpesaTransactionCode = document.getElementById('transaction-code').value;
                if (!mpesaNumber || !mpesaTransactionCode) {
                    showNotification('Please provide all required Mpesa details.', 'error');
                    return;
                }
                await saveMpesaPayment({ mpesaNumber, mpesaTransactionCode });
                break;

            default:
                showNotification('Invalid payment method selected.', 'error');
                break;
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        showNotification('An error occurred while processing your payment.', 'error');
    } finally {
        // Hide loader
        hideLoader();
    }
}

// Show payment info section based on selected payment method
function showPaymentForm(paymentMethod) {
    const container = document.getElementById('payment-info-container');
    container.innerHTML = ''; // Clear previous content

    let formHtml = '';
    switch (paymentMethod) {
        case 'credit-card':
            formHtml = `
                <div id="credit-card-info" class="payment-info">
                    <div class="form-group">
                        <label for="card-number">Card Number:</label>
                        <input type="text" id="card-number" name="card-number" placeholder="Enter card number" pattern="\\d{16}" required>
                    </div>
                    <div class="form-group">
                        <label for="card-expiry">Expiry Date:</label>
                        <input type="text" id="card-expiry" name="card-expiry" placeholder="MM/YY" required>
                    </div>
                    <div class="form-group">
                        <label for="card-cvc">CVC:</label>
                        <input type="text" id="card-cvc" name="card-cvc" placeholder="Enter CVC" pattern="\\d{3,4}" required>
                    </div>
                    <button type="button" class="btn-primary" id="submit-credit-card">Submit Credit Card Payment</button>
                </div>`;
            break;
            case 'paypal':
                formHtml = `
                    <div id="paypal-info" class="payment-info">
                          <div class="form-group">
                          <p style="font-weight: bold; font-size: larger;">
                    For your invoice, <a href="https://www.paypal.com/invoice/p/#WWES2ZJC35BGMVWK" target="_blank">click here to Proceed with Payments</a>.
                         </p>
                          </div>
                        <div class="form-group">
                            <label for="payment-email">PayPal Email:</label>
                            <input type="email" id="payment-email" name="payment-email" placeholder="Enter PayPal email" required>
                        </div>
                        <div class="form-group">
                            <label for="transaction-id">Transaction ID:</label>
                            <input type="text" id="transaction-id" name="transaction-id" placeholder="Enter transaction ID" required>
                        </div>

                        <button type="button" class="btn-primary" id="submit-paypal">Submit PayPal Payment</button>
                    </div>`;
                break;
            
        case 'bank-transfer':
            formHtml = `
                <div id="bank-transfer-info" class="payment-info">
                    <div class="form-group">
                        <label for="bank-name">Bank Name:</label>
                        <input type="text" id="bank-name" name="bank-name" placeholder="Enter bank name" required>
                    </div>
                    <div class="form-group">
                        <label for="account-number">Account Number:</label>
                        <input type="text" id="account-number" name="account-number" placeholder="Enter account number" required>
                    </div>
                    <div class="form-group">
                        <label for="transactions-code">Transaction Code:</label>
                        <input type="text" id="transactions-code" name="transactions-code" placeholder="Enter transaction code" required>
                    </div>
                    <div class="form-group">
                        <label for="phone-number">Phone Number:</label>
                        <input type="text" id="phone-number" name="phone-number" placeholder="Enter phone number" required>
                    </div>
                    <button type="button" class="btn-primary" id="submit-bank-transfer">Submit Bank Transfer Payment</button>
                </div>`;
            break;
        case 'mpesa':
            formHtml = `
                <div id="mpesa-info" class="payment-info">
                    <div class="form-group">
                        <label for="mpesa-number">Mpesa Number:</label>
                        <input type="tel" id="mpesa-number" name="mpesa-number" placeholder="Enter Mpesa number" pattern="\\d{10}" required>
                    </div>
                    <div class="form-group">
                        <label for="transaction-code">Transaction Code:</label>
                        <input type="text" id="transaction-code" name="transaction-code" placeholder="Enter transaction code" required>
                    </div>
                    <button type="button" class="btn-primary" id="submit-mpesa">Submit Mpesa Payment</button>
                </div>`;
            break;
        default:
            console.error('Invalid payment method selected');
            return;
    }
    container.innerHTML = formHtml;

    // Attach event listeners to buttons
    document.getElementById('submit-credit-card')?.addEventListener('click', () => {
        console.log("Credit card submit button clicked");
        submitPayment();
    });
    document.getElementById('submit-paypal')?.addEventListener('click', () => {
        console.log("PayPal submit button clicked");
        submitPayment();
    });
    document.getElementById('submit-bank-transfer')?.addEventListener('click', () => {
        console.log("Bank transfer submit button clicked");
        submitPayment();
    });
    document.getElementById('submit-mpesa')?.addEventListener('click', () => {
        console.log("Mpesa submit button clicked");
        submitPayment();
    });
    }

// Main DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    // Attach event listener to the payment method select element
    document.getElementById('payment-method').addEventListener('change', function () {
        const paymentMethod = this.value;
        showPaymentForm(paymentMethod);
    });
});


// Fetch headers with the dynamically retrieved current token
async function getHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}

function getBookingId() {
    return sessionStorage.getItem('bookingId');
}

 // Universal function to save payments based on method type
 async function savePayment(details, paymentType, endpoint) {
    const bookingId = getBookingId();
    if (!bookingId) {
        showNotification('No booking ID found.', 'error');
        return;
    }

    try {
        // Adjusted to remove token retrieval
        const headers = {
            'Content-Type': 'application/json'
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                booking_id: bookingId,
                ...details
            })
        });

        await handlePaymentResponse(response, paymentType);
    } catch (error) {
        console.error(`Error saving ${paymentType} payment:`, error);
        showNotification(`Failed to save ${paymentType} payment. Please try again.`, 'error');
    }
}

// Specific functions for each payment method

// Save Credit Card Payment
function saveCreditCardPayment(details) {
    const creditCardDetails = {
        card_number: details.cardNumber,
        expiry_date: details.cardExpiry,
        cvc: details.cardCvc
    };
    savePayment(creditCardDetails, 'Credit Card', '/credit-card-payments');
}

// Save PayPal Payment
function savePayPalPayment(details) {
    const paypalDetails = {
        payment_email: details.paymentEmail,
        transaction_id: details.transactionId
    };
    savePayment(paypalDetails, 'PayPal', '/paypal-payments');
}

// Save Bank Transfer Payment
function saveBankTransferPayment(details) {
    const bankTransferDetails = {
        bank_name: details.bankName,
        account_number: details.accountNumber,
        phone_number: details.phoneNumber,
        transaction_code: details.transactionCode

    };
    savePayment(bankTransferDetails, 'Bank Transfer', '/bank-transfer-payments');
}

// Save Mpesa Payment
function saveMpesaPayment(details) {
    const mpesaDetails = {
        mpesa_number: details.mpesaNumber,
        transaction_code: details.mpesaTransactionCode
    };
    savePayment(mpesaDetails, 'Mpesa', '/mpesa-payments');
}

// Handle the payment response and show notifications
async function handlePaymentResponse(response, paymentType) {
    try {
        const responseData = await response.json(); // Try parsing the response data

        if (!response.ok) {
            // If the response is not ok, display an error notification with the response message
            showNotification(`${paymentType} payment failed: ${responseData.message || 'Unknown error'}`, 'error');
        } else {
            // If the payment is successful, show a success notification
            showNotification(`${paymentType} payment successful: ${responseData.message}`, 'success');
        }
    } catch (error) {
        // If JSON parsing or network fails, handle the error
        console.error('Error handling payment response:', error);
        showNotification(`${paymentType} payment failed due to unexpected error. Please try again.`, 'error');
    }
}