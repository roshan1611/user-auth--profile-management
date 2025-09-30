$(document).ready(function() {
    // Check if user is already logged in
    const sessionToken = localStorage.getItem('sessionToken');
    const userEmail = localStorage.getItem('userEmail');
    
    if (sessionToken && userEmail) {
        window.location.href = 'PROFILE.HTML';
    }
    
    // Handle registration form submission
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val().trim();
        const password = $('#password').val();
        const confirmPassword = $('#confirm_password').val();
        
        // Clear previous alerts
        $('#alert-container').html('');
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Please enter a valid email address.', 'danger');
            return;
        }
        
        // Validate password length
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long.', 'danger');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            showAlert('Passwords do not match.', 'danger');
            return;
        }
        
        // Show loading state
        toggleLoadingState(true);
        
        // Make AJAX request
        $.ajax({
            url: 'assets/PHP/REGISTER.PHP',
            type: 'POST',
            dataType: 'json',
            data: {
                email: email,
                password: password
            },
            success: function(response) {
                toggleLoadingState(false);
                
                if (response.success) {
                    showAlert('Registration successful! Redirecting to login...', 'success');
                    
                    // Redirect to login page after 2 seconds
                    setTimeout(function() {
                        window.location.href = 'LOGIN.HTML';
                    }, 2000);
                } else {
                    showAlert(response.message || 'Registration failed. Please try again.', 'danger');
                }
            },
            error: function(xhr, status, error) {
                toggleLoadingState(false);
                
                let errorMessage = 'An error occurred. Please try again.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.status === 0) {
                    errorMessage = 'Unable to connect to server. Please check your connection.';
                }
                
                showAlert(errorMessage, 'danger');
                console.error('Registration error:', error);
            }
        });
    });
    
    // Helper function to show alerts
    function showAlert(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alert-container').html(alertHtml);
    }
    
    // Helper function to toggle loading state
    function toggleLoadingState(isLoading) {
        if (isLoading) {
            $('#btnText').addClass('d-none');
            $('#btnSpinner').removeClass('d-none');
            $('#registerBtn').prop('disabled', true);
        } else {
            $('#btnText').removeClass('d-none');
            $('#btnSpinner').addClass('d-none');
            $('#registerBtn').prop('disabled', false);
        }
    }
});