const Upload = {
    selectedFile: null,

    init() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const selectBtn = document.getElementById('selectBtn');
        const previewArea = document.getElementById('previewArea');
        const previewImage = document.getElementById('previewImage');
        const removeBtn = document.getElementById('removeBtn');
        const changeBtn = document.getElementById('changeBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');

        if (!uploadArea) return;

        // Click to select
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            imageInput.click();
        });

        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // File input change
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const file = e.dataTransfer.files[0];
            if (file && this.isValidImage(file)) {
                this.handleFile(file);
            } else {
                Toast.error('Please upload a valid image file (JPG, JPEG, PNG)');
            }
        });

        // Remove image
        removeBtn.addEventListener('click', () => {
            this.reset();
        });

        // Change image
        changeBtn.addEventListener('click', () => {
            imageInput.click();
        });

        // Analyze button
        analyzeBtn.addEventListener('click', () => {
            this.analyze();
        });
    },

    isValidImage(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        return validTypes.includes(file.type);
    },

    handleFile(file) {
        if (!this.isValidImage(file)) {
            Toast.error('Please upload a valid image file (JPG, JPEG, PNG)');
            return;
        }

        // Check file size (max 16MB)
        if (file.size > 16 * 1024 * 1024) {
            Toast.error('File size must be less than 16MB');
            return;
        }

        this.selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('uploadArea').style.display = 'none';
            document.getElementById('previewArea').style.display = 'block';
        };
        reader.readAsDataURL(file);
    },

    reset() {
        this.selectedFile = null;
        document.getElementById('imageInput').value = '';
        document.getElementById('previewImage').src = '';
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('previewArea').style.display = 'none';
        document.getElementById('results').style.display = 'none';
    },

    async analyze() {
        if (!this.selectedFile) {
            Toast.error('Please select an image first');
            return;
        }

        const analyzeBtn = document.getElementById('analyzeBtn');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const btnLoader = analyzeBtn.querySelector('.btn-loader');

        // Show loading state
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        analyzeBtn.disabled = true;

        try {
            const response = await API.predict(this.selectedFile);

            if (response.success) {
                this.displayResults(response);
                Toast.success('Analysis complete!');
            } else {
                Toast.error(response.message || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            Toast.error('Failed to analyze image. Please try again.');
        } finally {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    },

  displayResults(response) {
    const resultsSection = document.getElementById('results');
    const prediction = response.prediction;
    const diseaseInfo = response.disease_info || {};

    // Example:
    // Plant: Apple
    // Condition: scab / healthy / Early blight ...
    const plant = prediction.plant || 'Unknown plant';
    const condition = prediction.condition || prediction.class || prediction.raw_class || 'Unknown';

    // اجعل العنوان يعرض: "Apple - scab" أو "Apple - healthy"
    document.getElementById('diseaseName').textContent =
        `${plant} - ${condition}`;

    document.querySelector('.confidence-value').textContent =
        `${prediction.confidence}%`;

    document.getElementById('scientificName').textContent =
        diseaseInfo.scientific_name || 'Unknown';

    document.getElementById('secondGuess').textContent =
        prediction.second_guess || '';

    document.getElementById('secondConfidence').textContent =
        prediction.second_confidence
            ? `${prediction.second_confidence}% confidence`
            : '';

    // Description
    document.getElementById('description').textContent =
        diseaseInfo.description_ar ||
        diseaseInfo.description_en ||
        (prediction.has_details
            ? 'No description available.'
            : 'No detailed information for this class.');

    // Symptoms
    document.getElementById('symptoms').textContent =
        diseaseInfo.symptoms_ar ||
        diseaseInfo.symptoms_en ||
        (prediction.has_details
            ? 'No symptoms information available.'
            : 'No detailed information for this class.');

    // Treatment
    const treatmentEl = document.getElementById('treatment');
    if (diseaseInfo.treatment_ar || diseaseInfo.treatment_en) {
        treatmentEl.textContent =
            diseaseInfo.treatment_ar || diseaseInfo.treatment_en;
    } else if (prediction.has_details &&
               condition.toLowerCase().includes('healthy')) {
        treatmentEl.textContent = 'No treatment needed. Plant appears healthy.';
    } else if (prediction.has_details) {
        treatmentEl.textContent = 'Please consult a plant specialist.';
    } else {
        treatmentEl.textContent =
            'Model has no stored treatment info for this class.';
    }

    const guestNotice = document.getElementById('guestNotice');
    if (response.is_guest) {
        guestNotice.style.display = 'flex';
    } else {
        guestNotice.style.display = 'none';
    }

    resultsSection.style.display = 'block';
    resultsSection.classList.add('slide-up');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
};
