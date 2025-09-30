$(document).ready(function() {
    // Check if user is already logged in
    const sessionToken = localStorage.getItem('sessionToken');
    const userEmail = localStorage.getItem('userEmail');
    
    if (sessionToken && userEmail) {
        window.location.href = 'PROFILE.HTML';
    }
    
    // Handle login form submission
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val().trim();
        const password = $('#password').val();
        
        // Clear previous alerts
        $('#alert-container').html('');
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Please enter a valid email address.', 'danger');
            return;
        }
        
        // Validate password
        if (password.length === 0) {
            showAlert('Please enter your password.', 'danger');
            return;
        }
        
        // Show loading state
        toggleLoadingState(true);
        
        // Make AJAX request
        $.ajax({
            url: 'assets/PHP/LOGIN.PHP',
            type: 'POST',
            dataType: 'json',
            data: {
                email: email,
                password: password
            },
            success: function(response) {
                toggleLoadingState(false);
                
                if (response.success) {
                    // Store session information in localStorage
                    localStorage.setItem('sessionToken', response.sessionToken);
                    localStorage.setItem('userEmail', response.email);
                    localStorage.setItem('userId', response.userId);
                    
                    showAlert('Login successful! Redirecting...', 'success');
                    
                    // Redirect to profile page after 1 second
                    setTimeout(function() {
                        window.location.href = 'PROFILE.HTML';
                    }, 1000);
                } else {
                    showAlert(response.message || 'Login failed. Please check your credentials.', 'danger');
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
                console.error('Login error:', error);
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
            $('#loginBtn').prop('disabled', true);
        } else {
            $('#btnText').removeClass('d-none');
            $('#btnSpinner').addClass('d-none');
            $('#loginBtn').prop('disabled', false);
        }
    }
});