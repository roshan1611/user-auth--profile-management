$(document).ready(function() {
    // Check if user is logged in
    const sessionToken = localStorage.getItem('sessionToken');
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    if (!sessionToken || !userEmail || !userId) {
        window.location.href = 'LOGIN.HTML';
        return;
    }
    
    // Set email in the form (readonly field)
    $('#email').val(userEmail);
    
    // Load user profile data on page load
    loadProfile();
    
    // Handle profile form submission
    $('#profileForm').on('submit', function(e) {
        e.preventDefault();
        
        // Clear previous alerts
        $('#alert-container').html('');
        
        // Collect form data
        const profileData = {
            sessionToken: sessionToken,
            userId: userId,
            email: userEmail,
            full_name: $('#full_name').val().trim(),
            age: $('#age').val(),
            dob: $('#dob').val(),
            contact: $('#contact').val().trim(),
            address: $('#address').val().trim(),
            city: $('#city').val().trim(),
            country: $('#country').val().trim()
        };
        
        // Show loading state
        toggleLoadingState(true);
        
        // Make AJAX request to update profile
        $.ajax({
            url: 'assets/PHP/PROFILE.PHP',
            type: 'POST',
            dataType: 'json',
            data: profileData,
            success: function(response) {
                toggleLoadingState(false);
                
                if (response.success) {
                    showAlert('Profile updated successfully!', 'success');
                } else {
                    if (response.message === 'Invalid session') {
                        showAlert('Session expired. Please login again.', 'danger');
                        setTimeout(function() {
                            logout();
                        }, 2000);
                    } else {
                        showAlert(response.message || 'Failed to update profile.', 'danger');
                    }
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
                console.error('Profile update error:', error);
            }
        });
    });
    
    // Handle logout button
    $('#logoutBtn').on('click', function() {
        logout();
    });
    
    // Function to load profile data
    function loadProfile() {
        $.ajax({
            url: 'assets/PHP/PROFILE.PHP',
            type: 'GET',
            dataType: 'json',
            data: {
                sessionToken: sessionToken,
                userId: userId
            },
            success: function(response) {
                if (response.success && response.profile) {
                    // Populate form with profile data
                    $('#full_name').val(response.profile.full_name || '');
                    $('#age').val(response.profile.age || '');
                    $('#dob').val(response.profile.dob || '');
                    $('#contact').val(response.profile.contact || '');
                    $('#address').val(response.profile.address || '');
                    $('#city').val(response.profile.city || '');
                    $('#country').val(response.profile.country || '');
                } else if (response.message === 'Invalid session') {
                    showAlert('Session expired. Please login again.', 'danger');
                    setTimeout(function() {
                        logout();
                    }, 2000);
                }
            },
            error: function(xhr, status, error) {
                console.error('Profile load error:', error);
            }
        });
    }
    
    // Function to logout
    function logout() {
        // Clear localStorage
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        
        // Redirect to login page
        window.location.href = 'LOGIN.HTML';
    }
    
    // Helper function to show alerts
    function showAlert(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alert-container').html(alertHtml);
        
        // Scroll to top to show alert
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Helper function to toggle loading state
    function toggleLoadingState(isLoading) {
        if (isLoading) {
            $('#btnText').addClass('d-none');
            $('#btnSpinner').removeClass('d-none');
            $('#updateBtn').prop('disabled', true);
        } else {
            $('#btnText').removeClass('d-none');
            $('#btnSpinner').addClass('d-none');
            $('#updateBtn').prop('disabled', false);
        }
    }
});