document.addEventListener('DOMContentLoaded', function() {
    // References to step elements
    const steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-4'),
        document.getElementById('deletion-progress'),
        document.getElementById('deletion-complete')
    ];
    
    // References to buttons
    const btnStep1Next = document.getElementById('btn-step1-next');
    const btnStep2Prev = document.getElementById('btn-step2-prev');
    const btnStep2Next = document.getElementById('btn-step2-next');
    const btnStep3Prev = document.getElementById('btn-step3-prev');
    const btnStep3Next = document.getElementById('btn-step3-next');
    const btnStep4Prev = document.getElementById('btn-step4-prev');
    const btnDelete = document.getElementById('btn-delete');
    const btnNewDeletion = document.getElementById('btn-new-deletion');
    
    // References to other elements
    const progressBar = document.getElementById('progress-bar');
    const addFilesBtn = document.getElementById('btn-add-files');
    const addFolderBtn = document.getElementById('btn-add-folder');
    const fileList = document.getElementById('file-list');
    const methodCards = document.querySelectorAll('.method-card');
    const randomPasses = document.getElementById('random-passes');
    const confirmDeletion = document.getElementById('confirmDeletion');
    const confirmBackup = document.getElementById('confirmBackup');
    const summaryDeviceType = document.getElementById('summary-device-type');
    const summaryFileCount = document.getElementById('summary-file-count');
    const summaryMethod = document.getElementById('summary-method');
    const deletionProgressBar = document.getElementById('deletion-progress-bar');
    const deletionStatus = document.getElementById('deletion-status');
    const currentFile = document.getElementById('current-file');
    const viewCertificate = document.getElementById('view-certificate');
    const downloadCertificate = document.getElementById('download-certificate');
    
    // State variables
    let currentStep = 0;
    let selectedFiles = [];
    let selectedMethod = 'standard';
    let selectedMethodPasses = 1;
    let certificateId = null;
    
    // Show the specified step and update progress bar
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.remove('d-none');
            } else {
                step.classList.add('d-none');
            }
        });
        
        currentStep = stepIndex;
        
        // Update progress bar for steps 1-4
        if (stepIndex < 4) {
            const progress = (stepIndex + 1) * 25;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = `Step ${stepIndex + 1} of 4`;
        }
    }
    
    // Handler for the step 1 next button
    btnStep1Next.addEventListener('click', function() {
        // Get selected device type
        const deviceTypeRadio = document.querySelector('input[name="deviceType"]:checked');
        const deviceType = deviceTypeRadio ? deviceTypeRadio.value : 'Computer';
        
        // Update the summary
        summaryDeviceType.textContent = deviceType;
        
        // Show step 2
        showStep(1);
    });
    
    // Handler for adding files
    // Handler for adding files/folders in either mode
addFilesBtn.addEventListener('click', () => handleFileSelection(false));
addFolderBtn.addEventListener('click', () => handleFileSelection(true));

    
    // Handler for the step 2 previous button
    btnStep2Prev.addEventListener('click', function() {
        showStep(0);
    });
    
    // Handler for the step 2 next button
    btnStep2Next.addEventListener('click', function() {
        // Validate that files are selected
        if (selectedFiles.length === 0) {
            alert('Please select at least one file or folder to continue.');
            return;
        }
        
        // Update the summary
        summaryFileCount.textContent = `${selectedFiles.length} files/folders`;
        
        // Show step 3
        showStep(2);
    });
    
    // Handler for clicking on method cards
    methodCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            methodCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Update selected method
            selectedMethod = this.getAttribute('data-method');
            selectedMethodPasses = parseInt(this.getAttribute('data-passes'));
            
            // For random method, get the number of passes from the input
            if (selectedMethod === 'random') {
                selectedMethodPasses = parseInt(randomPasses.value);
            }
            
            // Update the summary
            updateMethodSummary();
        });
    });
    
    // Handler for changing random passes
    randomPasses.addEventListener('input', function() {
        if (selectedMethod === 'random') {
            selectedMethodPasses = parseInt(this.value);
            updateMethodSummary();
            
            // Update the data-passes attribute of the random method card
            const randomCard = document.querySelector('.method-card[data-method="random"]');
            randomCard.setAttribute('data-passes', this.value);
        }
    });
    
    // Handler for the step 3 previous button
    btnStep3Prev.addEventListener('click', function() {
        showStep(1);
    });
    
    // Handler for the step 3 next button
    btnStep3Next.addEventListener('click', function() {
        // Select a method if none is selected
        if (!document.querySelector('.method-card.selected')) {
            document.querySelector('.method-card[data-method="standard"]').classList.add('selected');
            selectedMethod = 'standard';
            selectedMethodPasses = 1;
            updateMethodSummary();
        }
        
        showStep(3);
    });
    
    // Handler for the step 4 previous button
    btnStep4Prev.addEventListener('click', function() {
        showStep(2);
    });
    
    // Handler for the confirmation checkboxes
    function updateDeleteButtonState() {
        btnDelete.disabled = !(confirmDeletion.checked && confirmBackup.checked);
    }
    
    confirmDeletion.addEventListener('change', updateDeleteButtonState);
    confirmBackup.addEventListener('change', updateDeleteButtonState);
    
    // Handler for the delete button
    btnDelete.addEventListener('click', function() {
        // Start the deletion process
        startDeletion();
    });
    
    // Handler for the new deletion button
    btnNewDeletion.addEventListener('click', function() {
        // Reset the state and go back to step 1
        resetState();
        showStep(0);
    });
    
    

document.getElementById("modeToggle").addEventListener("change", () => {
    const modeLabel = document.querySelector("label[for='modeToggle']");
    modeLabel.textContent = document.getElementById("modeToggle").checked 
        ? "Simulation Mode" 
        : "Real Mode";
});

async function handleFileSelection(isFolder) {
    const isSimulation = document.getElementById("modeToggle").checked;
    if (isSimulation) {
        simulateFileSelection(isFolder);
    } else {
        await realFileSelection(isFolder);
    }
}

// Real file selection (uses File System Access API)
async function realFileSelection(isFolder) {
    try {
        let handles = [];

        if (isFolder) {
            const dirHandle = await window.showDirectoryPicker();
            handles.push(dirHandle);
        } else {
            handles = await window.showOpenFilePicker({
                multiple: true
            });
        }

        for (const handle of handles) {
            const isFolderType = handle.kind === 'directory';
            selectedFiles.push({
                path: handle.name,
                isFolder: isFolderType,
                handle: handle,
                size: isFolderType ? 'Folder' : 'Unknown Size'
            });
        }

        updateFileList();
    } catch (err) {
        console.error('File/Folder selection cancelled or failed:', err);
    }
}

// Simulated file/folder selection
function simulateFileSelection(isFolder) {
    const fileTypes = ['Document', 'Spreadsheet', 'Presentation', 'Image', 'Video', 'Audio', 'Archive', 'Database'];
    const folderTypes = ['Documents', 'Pictures', 'Videos', 'Music', 'Downloads', 'Desktop', 'Projects', 'Backups'];

    let path;
    if (isFolder) {
        const folderType = folderTypes[Math.floor(Math.random() * folderTypes.length)];
        path = `/Users/username/${folderType}`;
    } else {
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const fileId = Math.floor(Math.random() * 1000);
        path = `/Users/username/Documents/${fileType}_${fileId}.${fileType.toLowerCase()}`;
    }

    selectedFiles.push({
        path: path,
        isFolder: isFolder,
        size: isFolder ? 'Folder' : `${Math.floor(Math.random() * 100) + 1} MB`
    });

    updateFileList();
}

    // Function to update the file list in the UI
    function updateFileList() {
        if (selectedFiles.length === 0) {
            fileList.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    <i class="fas fa-info-circle me-2"></i> No files/folders selected
                </li>
            `;
            return;
        }
        
        let html = '';
        selectedFiles.forEach((file, index) => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas ${file.isFolder ? 'fa-folder' : 'fa-file'} me-2"></i>
                        <span class="text-truncate" style="max-width: 300px; display: inline-block;">${file.path}</span>
                    </div>
                    <div>
                        <span class="badge bg-secondary me-2">${file.size}</span>
                        <button class="btn btn-sm btn-danger" onclick="removeFile(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </li>
            `;
        });
        
        fileList.innerHTML = html;
    }
    
    // Function to remove a file from the list
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
    };
    
    // Function to update the method summary
    function updateMethodSummary() {
        let methodName = '';
        switch (selectedMethod) {
            case 'standard':
                methodName = 'Standard Overwrite';
                break;
            case 'dod':
                methodName = 'DoD 5220.22-M';
                break;
            case 'gutmann':
                methodName = 'Gutmann Method';
                break;
            case 'random':
                methodName = 'Random Overwrite';
                break;
        }
        
        summaryMethod.textContent = `${methodName} (${selectedMethodPasses} ${selectedMethodPasses === 1 ? 'pass' : 'passes'})`;
    }
    
    // Function to start the deletion process
    function startDeletion() {
        // Show the deletion progress UI
        showStep(4);
        
        // Set up the simulated deletion process
        let progress = 0;
        const totalFiles = selectedFiles.length;
        let processedFiles = 0;
        
        // Simulate the deletion process with progress updates
        deletionStatus.innerHTML = '<span class="badge bg-info">Initializing secure deletion...</span>';
        
        // Start the progress bar animation
        const progressInterval = setInterval(() => {
            progress += 1;
            if (progress > 100) {
                clearInterval(progressInterval);
                completeDeletion();
                return;
            }
            
            // Update the progress bar
            deletionProgressBar.style.width = `${progress}%`;
            deletionProgressBar.setAttribute('aria-valuenow', progress);
            deletionProgressBar.textContent = `${progress}%`;
            
            // Simulate processing different files at different stages
            if (progress % (100 / totalFiles) < 1 && processedFiles < totalFiles) {
                const file = selectedFiles[processedFiles];
                processedFiles++;
                
                currentFile.textContent = `Processing: ${file.path}`;
                
                if (processedFiles === totalFiles) {
                    deletionStatus.innerHTML = '<span class="badge bg-warning">Finalizing...</span>';
                } else if (progress > 75) {
                    deletionStatus.innerHTML = '<span class="badge bg-success">Almost complete...</span>';
                } else if (progress > 50) {
                    deletionStatus.innerHTML = '<span class="badge bg-primary">Processing...</span>';
                } else if (progress > 25) {
                    deletionStatus.innerHTML = '<span class="badge bg-info">Overwriting data...</span>';
                }
            }
        }, 50); // Update every 50ms for a smoother animation
    }
    
    // Function to handle completion of the deletion process
    function completeDeletion() {
        // Simulate API call to register the deletion and get a certificate
        const deviceTypeRadio = document.querySelector('input[name="deviceType"]:checked');
        const deviceType = deviceTypeRadio ? deviceTypeRadio.value : 'Computer';
        
        // API call simulation
        simulateApiCall({
            file_paths: selectedFiles.map(file => file.path),
            method: selectedMethod,
            passes: selectedMethodPasses,
            device_type: deviceType
        })
        .then(response => {
            if (response.success) {
                certificateId = response.certificate_id;
                
                // Update the certificate links
                viewCertificate.href = `/certificate/${certificateId}`;
                downloadCertificate.href = `/api/download-certificate/${certificateId}`;
                
                // Show the completion UI
                showStep(5);
            } else {
                alert('Error completing secure deletion: ' + response.error);
                // Return to the previous step
                showStep(3);
            }
        })
        .catch(error => {
            alert('An unexpected error occurred: ' + error);
            showStep(3);
        });
    }
    
    // Function to simulate an API call
    function simulateApiCall(data) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Generate a random certificate ID
                const certificateId = 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                
                resolve({
                    success: true,
                    deleted_files: data.file_paths,
                    certificate_id: certificateId
                });
            }, 1000);
        });
    }
    
    // Function to reset the state for a new deletion
    function resetState() {
        // Reset selected files
        selectedFiles = [];
        updateFileList();
        
        // Reset method selection
        methodCards.forEach(card => card.classList.remove('selected'));
        document.querySelector('.method-card[data-method="standard"]').classList.add('selected');
        selectedMethod = 'standard';
        selectedMethodPasses = 1;
        randomPasses.value = 3;
        
        // Reset confirmation checkboxes
        confirmDeletion.checked = false;
        confirmBackup.checked = false;
        btnDelete.disabled = true;
        
        // Reset progress bar
        progressBar.style.width = '25%';
        progressBar.setAttribute('aria-valuenow', 25);
        progressBar.textContent = 'Step 1 of 4';
        
        // Reset deletion progress elements
        deletionProgressBar.style.width = '0%';
        deletionProgressBar.setAttribute('aria-valuenow', 0);
        deletionProgressBar.textContent = '0%';
        deletionStatus.innerHTML = '<span class="badge bg-info">Initializing...</span>';
        currentFile.textContent = '';
        
        // Reset certificate ID
        certificateId = null;
    }
    
    // Initialize the UI
    showStep(0);
    
    // Select the standard method by default
    document.querySelector('.method-card[data-method="standard"]').classList.add('selected');
});
