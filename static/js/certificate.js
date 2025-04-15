document.addEventListener('DOMContentLoaded', function() {
    // Handle print button click
    const printBtn = document.getElementById('btn-print-certificate');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Get the certificate ID from the URL if available
    const certificateId = window.location.pathname.split('/').pop();
    
    // Setup sharing functionality
    setupSharing(certificateId);
    
    // Setup verification status display if on verification page
    setupVerificationStatus();
});

// Function to handle sharing the certificate
function setupSharing(certificateId) {
    const shareBtn = document.getElementById('share-certificate');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if Web Share API is available
            if (navigator.share) {
                navigator.share({
                    title: 'Data Deletion Certificate',
                    text: 'Check my secure data deletion certificate',
                    url: window.location.href
                })
                .then(() => console.log('Shared successfully'))
                .catch(err => console.error('Error sharing:', err));
            } else {
                // Fallback for browsers that don't support Web Share API
                // Create a temporary input to copy the URL
                const input = document.createElement('input');
                input.style.position = 'fixed';
                input.style.opacity = 0;
                input.value = window.location.href;
                document.body.appendChild(input);
                input.select();
                
                try {
                    // Copy the URL to clipboard
                    document.execCommand('copy');
                    alert('Certificate URL copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy URL:', err);
                    alert('Failed to copy URL. Please copy it manually.');
                }
                
                document.body.removeChild(input);
            }
        });
    }
}

// Function to setup verification status display
function setupVerificationStatus() {
    const verificationStatus = document.getElementById('verification-status');
    const verifyForm = document.getElementById('verify-certificate-form');
    
    if (verifyForm) {
        verifyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const certificateId = document.getElementById('certificate-id-input').value;
            const verificationCode = document.getElementById('verification-code-input').value;
            
            if (!certificateId || !verificationCode) {
                showVerificationMessage('Please enter both Certificate ID and Verification Code', 'danger');
                return;
            }
            
            // Simulate verification process (in a real app, this would be an API call)
            simulateVerification(certificateId, verificationCode);
        });
    }
}

// Function to simulate certificate verification
function simulateVerification(certificateId, verificationCode) {
    const verificationStatus = document.getElementById('verification-status');
    
    // Show loading message
    showVerificationMessage('<i class="fas fa-spinner fa-spin me-2"></i> Verifying certificate...', 'info');
    
    // Simulate API call delay
    setTimeout(() => {
        // In a real app, this would check against the database
        // For simulation, we'll accept any input that's not empty
        if (certificateId && verificationCode) {
            // Redirect to certificate page
            window.location.href = `/certificate/${certificateId}`;
        } else {
            showVerificationMessage('<i class="fas fa-times-circle me-2"></i> Invalid Certificate ID or Verification Code', 'danger');
        }
    }, 1500);
}

// Function to show verification messages
function showVerificationMessage(message, type) {
    const verificationStatus = document.getElementById('verification-status');
    
    if (verificationStatus) {
        verificationStatus.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

// Function to generate and display QR code
function generateQRCode(certificateId, verificationCode) {
    const qrcodeElement = document.getElementById('qrcode');
    
    if (qrcodeElement && typeof QRCode !== 'undefined') {
        // Clear any existing QR code
        qrcodeElement.innerHTML = '';
        
        // Generate verification URL
        const verificationUrl = `${window.location.origin}/verify?id=${certificateId}&code=${verificationCode}`;
        
        // Generate QR code
        new QRCode(qrcodeElement, {
            text: verificationUrl,
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}
