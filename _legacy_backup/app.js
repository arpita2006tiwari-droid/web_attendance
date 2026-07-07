/**
   SyncAttend Application Logic
   =========================================
   Manages state, DOM updates, event handlers, and Sheets API integration.
 */

// --- Constants & Config ---
const STORAGE_KEYS = {
  MODE: 'syncattend_mode', // 'demo' or 'live'
  API_URL: 'syncattend_api_url',
  THEME: 'syncattend_theme',
  SHOW_OPTIONAL: 'syncattend_show_optional',
  LOCAL_SESSIONS: 'syncattend_local_sessions' // for storing demo saves
};

// --- Dummy Database for JBCN Oshiwara and JBCN Lower Parel ---
const DUMMY_DATABASE = {
  'JBCN Oshiwara': {
    'Oshiwara Nursery Alpha': [
      { srNo: 1, name: 'Aarav Mehta' },
      { srNo: 2, name: 'Diya Sharma' },
      { srNo: 3, name: 'Kabir Malhotra' },
      { srNo: 4, name: 'Rohan Sen' },
      { srNo: 5, name: 'Tara Deshmukh' }
    ],
    'Oshiwara Gr. 1 Beta': [
      { srNo: 1, name: 'Arjun Kapoor' },
      { srNo: 2, name: 'Isha Patel' },
      { srNo: 3, name: 'Neil Singhania' },
      { srNo: 4, name: 'Riya Roy' },
      { srNo: 5, name: 'Veer Malhotra' }
    ]
  },
  'JBCN Lower Parel': {
    'Lower Parel Sr. Kg Gamma': [
      { srNo: 1, name: 'Aditya Sen' },
      { srNo: 2, name: 'Kiara Bose' },
      { srNo: 3, name: 'Vivaan Shah' },
      { srNo: 4, name: 'Ananya Roy' },
      { srNo: 5, name: 'Reyansh Singhal' }
    ],
    'Lower Parel Gr. 2 Delta': [
      { srNo: 1, name: 'Dev Patel' },
      { srNo: 2, name: 'Myra Kapoor' },
      { srNo: 3, name: 'Samarth Joshi' },
      { srNo: 4, name: 'Tanya Seth' },
      { srNo: 5, name: 'Yuvaan Gupta' }
    ]
  }
};

const getInitialApiUrl = () => {
  const url = localStorage.getItem(STORAGE_KEYS.API_URL);
  const defaultUrl = 'https://script.google.com/macros/s/AKfycbyARU61cWMWnMBtGUFPPcQzWq3qit6WfoBG0Huj7KWGXP_XeN4nDc6m97fOPMBZvCE_Vw/exec';

  if (url && url.startsWith('data:')) {
    // Clear corrupted state left by debugging sessions
    localStorage.removeItem(STORAGE_KEYS.API_URL);
    localStorage.removeItem(STORAGE_KEYS.MODE);
    return defaultUrl;
  }
  return url || defaultUrl;
};

// If only a corrupted data: URL was stored (no real URL), reset mode back to demo
const storedUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
if (storedUrl && storedUrl.startsWith('data:')) {
  localStorage.removeItem(STORAGE_KEYS.MODE);
}

// --- App State ---
const state = {
  mode: localStorage.getItem(STORAGE_KEYS.MODE) || 'live',
  apiUrl: getInitialApiUrl(),
  showOptional: localStorage.getItem(STORAGE_KEYS.SHOW_OPTIONAL) !== 'false', // default true
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'light',

  schoolCenter: '',   // JBCN Mulund / Oshiwara / Lower Parel
  schoolCenters: [],  // Loaded dynamically from sheets
  centers: [],
  selectedCenter: '',
  students: [], // Array of { srNo, name, status }

  searchQuery: '',
  centerSearchQuery: '',
  isSaving: false,

  // Date/Time override tracking
  dateOverridden: false,
  timeOverridden: false,
  dateTimerInterval: null
};

// --- DOM Elements Cache ---
const DOM = {
  themeToggle: document.getElementById('theme-toggle'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsOverlay: document.getElementById('settings-overlay'),
  settingsDrawer: document.getElementById('settings-drawer'),
  settingsClose: document.getElementById('settings-close'),

  modeCheckbox: document.getElementById('mode-checkbox'),
  modeLabelText: document.getElementById('mode-label-text'),
  modeBadge: document.getElementById('mode-badge'),
  modeBadgeText: document.getElementById('mode-badge-text'),
  urlConfigGroup: document.getElementById('url-config-group'),
  appsScriptUrl: document.getElementById('apps-script-url'),
  urlValBadge: document.getElementById('url-val-badge'),
  testConnectionBtn: document.getElementById('test-connection-btn'),
  showOptionalStates: document.getElementById('show-optional-states'),

  selectTrigger: document.getElementById('select-trigger'),
  selectedCenterLabel: document.getElementById('selected-center-label'),
  selectDropdown: document.getElementById('select-dropdown'),
  centerSearchInput: document.getElementById('center-search-input'),
  clearCenterSearchBtn: document.getElementById('clear-center-search-btn'),
  dropdownOptionsList: document.getElementById('dropdown-options-list'),
  batchSelectorRow: document.getElementById('batch-selector-row'),

  schoolCenterSelect: document.getElementById('school-center-select'),
  currentDateInput: document.getElementById('current-date-input'),
  currentTimeInput: document.getElementById('current-time-input'),
  resetTimeBtn: document.getElementById('reset-time-btn'),

  statsSummary: document.getElementById('stats-summary'),
  statTotalVal: document.getElementById('stat-total-val'),
  statPresentVal: document.getElementById('stat-present-val'),
  statAbsentVal: document.getElementById('stat-absent-val'),
  statPendingVal: document.getElementById('stat-pending-val'),

  attendanceSection: document.getElementById('attendance-section'),
  studentSearch: document.getElementById('student-search'),
  clearStudentSearchBtn: document.getElementById('clear-student-search-btn'),
  bulkPresentBtn: document.getElementById('bulk-present-btn'),
  bulkAbsentBtn: document.getElementById('bulk-absent-btn'),
  studentList: document.getElementById('student-list'),
  emptySearchState: document.getElementById('empty-search-state'),
  welcomeSection: document.getElementById('welcome-section'),
  welcomeSelectTrigger: document.getElementById('welcome-select-trigger'),

  actionFooter: document.getElementById('action-footer'),
  unmarkedWarningText: document.getElementById('unmarked-warning-text'),
  resetBtn: document.getElementById('reset-btn'),
  saveBtn: document.getElementById('save-btn'),
  saveBtnText: document.getElementById('save-btn-text'),
  saveSpinner: document.querySelector('#save-btn .spinner'),
  saveIcon: document.querySelector('#save-btn .save-icon'),

  successSection: document.getElementById('success-section'),
  successCenterVal: document.getElementById('success-center-val'),
  successBatchVal: document.getElementById('success-batch-val'),
  successDatetimeVal: document.getElementById('success-datetime-val'),
  successStatsVal: document.getElementById('success-stats-val'),
  successAgainBtn: document.getElementById('success-again-btn'),
  successEditBtn: document.getElementById('success-edit-btn'),
  successExitBtn: document.getElementById('success-exit-btn'),

  toastContainer: document.getElementById('toast-container')
};

// --- Initialization ---
// Scripts are placed at the bottom of <body>, so the DOM is already ready.
// We call init directly instead of waiting for DOMContentLoaded to avoid
// a race condition where the event has already fired before the listener is added.
function init() {
  initTheme();
  initSettingsPanel();
  initDateTime();
  initSchoolCenterDropdown();
  initCenterDropdown();
  initStudentFilterAndBulk();
  initSaveAndResetActions();
  initSuccessActions();
}

// Safely handle both cases: DOM ready now, or not yet
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// --- Theme Management ---
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcons();

  DOM.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcons();
    showToast(`Switched to ${state.theme === 'light' ? 'Light' : 'Dark'} mode`, 'info');
  });
}

function updateThemeIcons() {
  if (state.theme === 'dark') {
    DOM.sunIcon.style.display = 'none';
    DOM.moonIcon.style.display = 'block';
  } else {
    DOM.sunIcon.style.display = 'block';
    DOM.moonIcon.style.display = 'none';
  }
}

// --- Date & Time with Editable Inputs ---
function initDateTime() {
  // Set initial values from current time
  setDateInputToNow();
  setTimeInputToNow();

  // Auto-tick the time every second (only when not manually overridden)
  state.dateTimerInterval = setInterval(() => {
    if (!state.timeOverridden) {
      setTimeInputToNow();
    }
    // Date also auto-advances at midnight (if not overridden)
    if (!state.dateOverridden) {
      setDateInputToNow();
    }
  }, 1000);

  // Listen for manual date change via calendar picker
  DOM.currentDateInput.addEventListener('change', () => {
    state.dateOverridden = true;
  });

  // Listen for manual time edit
  DOM.currentTimeInput.addEventListener('change', () => {
    state.timeOverridden = true;
    DOM.resetTimeBtn.style.display = 'inline-flex';
  });

  // "Now" reset button
  DOM.resetTimeBtn.addEventListener('click', () => {
    state.timeOverridden = false;
    state.dateOverridden = false;
    setTimeInputToNow();
    setDateInputToNow();
    DOM.resetTimeBtn.style.display = 'none';
    showToast('Date & time reset to current', 'info');
  });
}

function setDateInputToNow() {
  const now = new Date();
  // Format: YYYY-MM-DD for <input type="date">
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  DOM.currentDateInput.value = `${yyyy}-${mm}-${dd}`;
}

function setTimeInputToNow() {
  const now = new Date();
  // Format: HH:MM for <input type="time">
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  DOM.currentTimeInput.value = `${hh}:${mm}`;
}

// Helper: read the user-selected (or auto) date as a display string
function getSelectedDateString() {
  const val = DOM.currentDateInput.value; // YYYY-MM-DD
  if (!val) return '';
  const [yyyy, mm, dd] = val.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${parseInt(dd)} ${months[parseInt(mm) - 1]} ${yyyy}`;
}

// Helper: read the user-selected (or auto) time as a display string
function getSelectedTimeString() {
  const val = DOM.currentTimeInput.value; // HH:MM
  if (!val) return '';
  let [hh, mm] = val.split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12;
  hh = hh === 0 ? 12 : hh;
  return `${hh}:${String(mm).padStart(2, '0')} ${ampm}`;
}

// --- School Center (Location) Dropdown ---
function initSchoolCenterDropdown() {
  DOM.schoolCenterSelect.addEventListener('change', (e) => {
    state.schoolCenter = e.target.value;
    showToast(`Center set to ${state.schoolCenter}`, 'info');

    // Reset selection state
    resetSelectionState();

    // Toggle container display and handle data loading
    if (state.schoolCenter) {
      DOM.batchSelectorRow.style.display = 'block';
      loadBatches(state.schoolCenter);
    } else {
      DOM.batchSelectorRow.style.display = 'none';
    }
  });

  // Load centers dynamically from spreadsheet on app start
  loadSchoolCenters();
}

// Load/refresh the list of school centers (sheet worksheets)
async function loadSchoolCenters() {
  if (state.mode === 'demo') {
    state.schoolCenters = ['JBCN Mulund', 'JBCN Oshiwara', 'JBCN Lower Parel'];
    renderSchoolCenterOptions();
  } else {
    if (!state.apiUrl) {
      DOM.schoolCenterSelect.innerHTML = '<option value="" disabled selected>API URL not set...</option>';
      return;
    }

    try {
      const response = await fetch(`${state.apiUrl}?action=get_centers`, {
        method: 'GET',
        mode: 'cors'
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.centers)) {
        // Format sheet names to Title Case for visual polish
        state.schoolCenters = data.centers.map(name => {
          return name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        });
        renderSchoolCenterOptions();
      } else {
        throw new Error(data.error || 'Server error loading centers');
      }
    } catch (error) {
      console.error('Failed to load school centers:', error);
      showToast('Failed to fetch school centers from Google Sheet.', 'error');
    }
  }
}

// Populate the school center native select element options
function renderSchoolCenterOptions() {
  const select = DOM.schoolCenterSelect;
  const currentValue = select.value;
  select.innerHTML = '<option value="" disabled selected>Choose center...</option>';

  state.schoolCenters.forEach(center => {
    const option = document.createElement('option');
    option.value = center;
    option.textContent = center;
    select.appendChild(option);
  });

  // Re-select value if it was already selected and is still valid
  if (currentValue && state.schoolCenters.includes(currentValue)) {
    select.value = currentValue;
  } else {
    state.schoolCenter = '';
  }
}

// --- Settings & Configuration Panel ---
function initSettingsPanel() {
  // Open / Close Drawer
  const openSettings = () => {
    DOM.settingsOverlay.classList.add('show');
    // Validate current configuration URL on open
    validateUrlBadge();
  };

  const closeSettings = () => {
    DOM.settingsOverlay.classList.remove('show');
  };

  DOM.settingsBtn.addEventListener('click', openSettings);
  DOM.settingsClose.addEventListener('click', closeSettings);

  // Close drawer if clicking backdrop
  DOM.settingsOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.settingsOverlay) {
      closeSettings();
    }
  });

  // Settings checkbox & input values mapping
  DOM.appsScriptUrl.value = state.apiUrl;
  DOM.showOptionalStates.checked = state.showOptional;

  // Mode Checkbox: checked means 'live', unchecked means 'demo'
  DOM.modeCheckbox.checked = (state.mode === 'live');
  updateModeUI(state.mode);

  DOM.modeCheckbox.addEventListener('change', (e) => {
    const newMode = e.target.checked ? 'live' : 'demo';
    state.mode = newMode;
    localStorage.setItem(STORAGE_KEYS.MODE, newMode);
    updateModeUI(newMode);

    // Clear selections and reload batch options
    resetSelectionState();
    loadSchoolCenters();

    showToast(`Switched to ${newMode === 'live' ? 'Live Sheets' : 'Demo'} database mode`, 'info');
  });

  // API URL Input Listener
  DOM.appsScriptUrl.addEventListener('input', (e) => {
    state.apiUrl = e.target.value.trim();
    localStorage.setItem(STORAGE_KEYS.API_URL, state.apiUrl);
    validateUrlBadge();
    loadSchoolCenters();
  });

  // Test connection button
  DOM.testConnectionBtn.addEventListener('click', testSheetsConnection);

  // Show optional states toggle
  DOM.showOptionalStates.addEventListener('change', (e) => {
    state.showOptional = e.target.checked;
    localStorage.setItem(STORAGE_KEYS.SHOW_OPTIONAL, state.showOptional);
    // If students list is currently loaded, re-render it to apply changes
    if (state.students.length > 0) {
      renderStudentList();
    }
    showToast(`${state.showOptional ? 'Enabled' : 'Disabled'} optional attendance statuses`, 'info');
  });
}

function updateModeUI(mode) {
  if (mode === 'live') {
    DOM.modeLabelText.textContent = 'Live Sheets Mode';
    DOM.modeLabelText.className = 'mode-status-title';
    DOM.modeLabelText.style.color = 'var(--color-present)';

    DOM.modeBadge.className = 'status-badge live-mode';
    DOM.modeBadgeText.textContent = 'Live Mode';

    DOM.urlConfigGroup.style.display = 'flex';
  } else {
    DOM.modeLabelText.textContent = 'Demo Mode';
    DOM.modeLabelText.className = 'mode-status-title';
    DOM.modeLabelText.style.color = '#d97706'; // Amber color

    DOM.modeBadge.className = 'status-badge demo-mode';
    DOM.modeBadgeText.textContent = 'Demo Mode';

    DOM.urlConfigGroup.style.display = 'none';
  }
}

function validateUrlBadge() {
  const url = state.apiUrl;
  if (!url) {
    DOM.urlValBadge.textContent = 'Not Configured';
    DOM.urlValBadge.className = 'url-validation-badge warn';
  } else if (!url.startsWith('https://script.google.com/macros/s/')) {
    DOM.urlValBadge.textContent = 'Invalid Format';
    DOM.urlValBadge.className = 'url-validation-badge error';
  } else {
    DOM.urlValBadge.textContent = 'Ready to Test';
    DOM.urlValBadge.className = 'url-validation-badge warn';
  }
}

// Check network status by pinging doGet script
async function testSheetsConnection() {
  if (!state.apiUrl) {
    showToast('Please enter an Apps Script Web App URL first.', 'error');
    return;
  }

  if (!state.apiUrl.startsWith('https://script.google.com/macros/s/')) {
    showToast('Invalid Google Apps Script URL format.', 'error');
    return;
  }

  DOM.testConnectionBtn.disabled = true;
  DOM.testConnectionBtn.textContent = 'Testing connection...';

  try {
    // Append dummy parameter to verify endpoint
    const response = await fetch(`${state.apiUrl}?action=ping`, {
      method: 'GET',
      mode: 'cors'
    });

    const result = await response.json();
    if (result && result.success) {
      DOM.urlValBadge.textContent = 'Connected';
      DOM.urlValBadge.className = 'url-validation-badge success';
      showToast('Successfully connected to Google Sheet API!', 'success');
      loadSchoolCenters();
    } else {
      throw new Error(result.error || 'Unknown script response');
    }
  } catch (err) {
    console.error('Test connection error:', err);
    DOM.urlValBadge.textContent = 'Failed';
    DOM.urlValBadge.className = 'url-validation-badge error';
    showToast('Connection failed. Verify deployment settings (Access: "Anyone").', 'error');
  } finally {
    DOM.testConnectionBtn.disabled = false;
    DOM.testConnectionBtn.textContent = 'Test Connection';
  }
}

// --- Center/Batch Selection Dropdown Logic ---
function initCenterDropdown() {
  // Toggle Dropdown Options Menu
  DOM.selectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = DOM.selectTrigger.classList.toggle('open');
    DOM.selectDropdown.classList.toggle('show', isOpen);
    if (isOpen) {
      DOM.centerSearchInput.focus();
    }
  });

  // Also hook Welcome Card select button to trigger batch selector
  DOM.welcomeSelectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.schoolCenter) {
      DOM.schoolCenterSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      DOM.schoolCenterSelect.focus();
      showToast('Please select a center first.', 'warning');
      return;
    }
    DOM.selectTrigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
    DOM.selectTrigger.click();
  });

  // Handle typing to filter batch names inside dropdown
  DOM.centerSearchInput.addEventListener('input', (e) => {
    state.centerSearchQuery = e.target.value.toLowerCase().trim();
    DOM.clearCenterSearchBtn.style.display = state.centerSearchQuery ? 'block' : 'none';
    renderCenterOptions();
  });

  // Clear search inside dropdown
  DOM.clearCenterSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.centerSearchInput.value = '';
    state.centerSearchQuery = '';
    DOM.clearCenterSearchBtn.style.display = 'none';
    DOM.centerSearchInput.focus();
    renderCenterOptions();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    DOM.selectTrigger.classList.remove('open');
    DOM.selectDropdown.classList.remove('show');
  });

  // Prevent dropdown closing when clicking inside menu contents
  DOM.selectDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

function resetSelectionState() {
  state.selectedCenter = '';
  state.students = [];
  DOM.selectedCenterLabel.textContent = 'Choose a batch...';
  DOM.selectedCenterLabel.style.color = '';

  DOM.statsSummary.style.display = 'none';
  DOM.attendanceSection.style.display = 'none';
  DOM.actionFooter.style.display = 'none';
  DOM.welcomeSection.style.display = 'flex';

  DOM.studentSearch.value = '';
  state.searchQuery = '';
  DOM.clearStudentSearchBtn.style.display = 'none';
}

// Fetch list of batches for the selected center
async function loadBatches(centerName) {
  if (state.mode === 'demo') {
    // In Demo Mode, load mock batch names based on the chosen center
    if (centerName === 'JBCN Mulund') {
      if (typeof STUDENT_DATABASE !== 'undefined') {
        state.centers = Object.keys(STUDENT_DATABASE);
      } else {
        state.centers = [];
        showToast('Error loading preloaded student database.', 'error');
      }
    } else if (DUMMY_DATABASE[centerName]) {
      state.centers = Object.keys(DUMMY_DATABASE[centerName]);
    } else {
      state.centers = [];
    }
    renderCenterOptions();
  } else {
    // In Live Mode, fetch batches from Google Apps Script Web App for the selected center
    if (!state.apiUrl) {
      DOM.selectedCenterLabel.textContent = 'Setup API in Settings...';
      DOM.selectedCenterLabel.style.color = 'var(--color-absent)';
      return;
    }

    DOM.selectedCenterLabel.textContent = 'Loading batches...';
    try {
      const response = await fetch(`${state.apiUrl}?action=get_batches&center=${encodeURIComponent(centerName)}`, {
        method: 'GET',
        mode: 'cors'
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.batches)) {
        state.centers = data.batches;
        renderCenterOptions();
        DOM.selectedCenterLabel.textContent = 'Choose a batch...';
        DOM.selectedCenterLabel.style.color = '';
      } else {
        throw new Error(data.error || 'Server error loading batches');
      }
    } catch (error) {
      console.error(error);
      DOM.selectedCenterLabel.textContent = 'Loading failed';
      DOM.selectedCenterLabel.style.color = 'var(--color-absent)';
      showToast('Failed to fetch batches from Google Sheet.', 'error');
    }
  }
}

// Render batch options in dropdown list
function renderCenterOptions() {
  DOM.dropdownOptionsList.innerHTML = '';

  const filtered = state.centers.filter(center =>
    center.toLowerCase().includes(state.centerSearchQuery)
  );

  if (filtered.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'dropdown-no-results';
    noResults.textContent = 'No matching batches found';
    DOM.dropdownOptionsList.appendChild(noResults);
    return;
  }

  filtered.forEach(center => {
    const option = document.createElement('div');
    option.className = 'dropdown-option';
    if (center === state.selectedCenter) {
      option.classList.add('selected');
    }

    option.innerHTML = `
      <span>${center}</span>
      ${center === state.selectedCenter ? '✓' : ''}
    `;

    option.addEventListener('click', () => {
      selectCenter(center);
      // Close dropdown
      DOM.selectTrigger.classList.remove('open');
      DOM.selectDropdown.classList.remove('show');
    });

    DOM.dropdownOptionsList.appendChild(option);
  });
}

// Select a batch and pull student records
async function selectCenter(batchName) {
  state.selectedCenter = batchName;
  DOM.selectedCenterLabel.textContent = batchName;
  DOM.selectedCenterLabel.style.color = 'var(--text-main)';

  // Highlight chosen option in dropdown options
  renderCenterOptions();

  // Transition views: show loading indicator
  DOM.welcomeSection.style.display = 'none';
  DOM.statsSummary.style.display = 'grid';
  DOM.attendanceSection.style.display = 'block';
  DOM.actionFooter.style.display = 'block';

  // Show skeleton loading inside student list
  renderStudentListSkeleton();

  if (state.mode === 'demo') {
    // Simulate loading lag for visual polish
    setTimeout(() => {
      let mockStudents = null;
      if (state.schoolCenter === 'JBCN Mulund') {
        if (typeof STUDENT_DATABASE !== 'undefined' && STUDENT_DATABASE[batchName]) {
          mockStudents = STUDENT_DATABASE[batchName];
        }
      } else if (DUMMY_DATABASE[state.schoolCenter] && DUMMY_DATABASE[state.schoolCenter][batchName]) {
        mockStudents = DUMMY_DATABASE[state.schoolCenter][batchName];
      }

      if (mockStudents) {
        // Map student array, default status = 'Present'
        state.students = mockStudents.map(s => ({
          srNo: s.srNo,
          name: s.name,
          status: 'Present'
        }));

        // Render UI
        renderStudentList();
        updateStatsSummary();
        showToast(`Loaded ${state.students.length} students from ${batchName}`, 'success');
      } else {
        renderEmptyStudentsState();
      }
    }, 600);
  } else {
    // Pull live data from API
    try {
      const url = `${state.apiUrl}?action=get_students&center=${encodeURIComponent(state.schoolCenter)}&batch=${encodeURIComponent(batchName)}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      const data = await response.json();
      if (data && data.success && Array.isArray(data.students)) {
        state.students = data.students.map(s => ({
          srNo: s.srNo,
          name: s.name,
          status: 'Present'
        }));

        renderStudentList();
        updateStatsSummary();
        showToast(`Loaded ${state.students.length} students from ${batchName}`, 'success');
      } else {
        throw new Error(data.error || 'Server failed to fetch student list');
      }
    } catch (err) {
      console.error(err);
      renderEmptyStudentsState('Failed to load student list. Check connectivity.');
      showToast('Network error loading students.', 'error');
    }
  }
}

// Render skeleton card placeholders during data fetches
function renderStudentListSkeleton() {
  DOM.studentList.innerHTML = '';
  DOM.emptySearchState.style.display = 'none';

  for (let i = 0; i < 5; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'student-row-card';
    skeleton.style.opacity = '0.6';
    skeleton.style.pointerEvents = 'none';

    skeleton.innerHTML = `
      <div class="student-info" style="width: 100%;">
        <div class="student-serial-badge" style="background: var(--border-color); color: transparent;">-</div>
        <div class="student-name" style="background: var(--border-color); border-radius: 4px; width: 45%; height: 16px;"></div>
      </div>
      <div class="attendance-button-group" style="background: var(--border-color); width: 180px; height: 36px; border: none;"></div>
    `;
    DOM.studentList.appendChild(skeleton);
  }
}

function renderEmptyStudentsState(message = 'No student records found in this batch.') {
  DOM.studentList.innerHTML = '';
  DOM.emptySearchState.style.display = 'block';
  DOM.emptySearchState.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h3>No records available</h3>
    <p>${message}</p>
  `;

  // Set stats to 0
  state.students = [];
  updateStatsSummary();
}

// --- Student List Rendering & Actions ---
function renderStudentList() {
  DOM.studentList.innerHTML = '';
  DOM.emptySearchState.style.display = 'none';

  // Filter student rows based on search input query
  const filtered = state.students.filter(student =>
    student.name.toLowerCase().includes(state.searchQuery)
  );

  if (filtered.length === 0) {
    DOM.emptySearchState.style.display = 'block';
    return;
  }

  filtered.forEach(student => {
    const card = document.createElement('div');
    card.className = 'student-row-card';

    // Original Serial Number column
    const srBadge = student.srNo ? `<div class="student-serial-badge">${student.srNo}</div>` : '';

    // Core HTML template for student list card row
    card.innerHTML = `
      <div class="student-info">
        ${srBadge}
        <span class="student-name" title="${student.name}">${student.name}</span>
      </div>
      <div class="attendance-button-group" role="group" aria-label="Attendance for ${student.name}">
        <button type="button" class="status-btn present-state ${student.status === 'Present' ? 'active' : ''}" data-status="Present">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Present
        </button>
        <button type="button" class="status-btn absent-state ${student.status === 'Absent' ? 'active' : ''}" data-status="Absent">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          Absent
        </button>
        ${state.showOptional ? `
          <button type="button" class="status-btn late-state ${student.status === 'Late' ? 'active' : ''}" data-status="Late">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Late
          </button>
          <button type="button" class="status-btn holiday-state ${student.status === 'Holiday' ? 'active' : ''}" data-status="Holiday">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Holiday
          </button>
          <button type="button" class="status-btn leave-state ${student.status === 'Leave' ? 'active' : ''}" data-status="Leave">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Leave
          </button>
        ` : ''}
      </div>
    `;

    // Attach status toggle listener
    const buttons = card.querySelectorAll('.status-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStatus = btn.getAttribute('data-status');
        updateStudentStatus(student.name, nextStatus);
      });
    });

    DOM.studentList.appendChild(card);
  });
}

function updateStudentStatus(studentName, newStatus) {
  const student = state.students.find(s => s.name === studentName);
  if (student) {
    student.status = newStatus;

    // Re-render UI list cards efficiently or repaint buttons
    renderStudentList();
    updateStatsSummary();
  }
}

// --- Search Filter & Bulk Actions ---
function initStudentFilterAndBulk() {
  // Input search box filter
  DOM.studentSearch.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    DOM.clearStudentSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderStudentList();
  });

  // Clear search field
  DOM.clearStudentSearchBtn.addEventListener('click', () => {
    DOM.studentSearch.value = '';
    state.searchQuery = '';
    DOM.clearStudentSearchBtn.style.display = 'none';
    DOM.studentSearch.focus();
    renderStudentList();
  });

  // Bulk mark visible students
  DOM.bulkPresentBtn.addEventListener('click', () => {
    bulkMarkVisibleStudents('Present');
  });

  DOM.bulkAbsentBtn.addEventListener('click', () => {
    bulkMarkVisibleStudents('Absent');
  });
}

function bulkMarkVisibleStudents(status) {
  // Apply status marking to all currently visible/filtered students
  const filtered = state.students.filter(student =>
    student.name.toLowerCase().includes(state.searchQuery)
  );

  if (filtered.length === 0) return;

  filtered.forEach(student => {
    student.status = status;
  });

  renderStudentList();
  updateStatsSummary();
  showToast(`Marked ${filtered.length} students as ${status}`, 'success');
}

// --- Stats Recalculations ---
function updateStatsSummary() {
  const total = state.students.length;
  const present = state.students.filter(s => s.status === 'Present').length;
  const absent = state.students.filter(s => s.status === 'Absent').length;

  // Optional counts
  const late = state.students.filter(s => s.status === 'Late').length;
  const holiday = state.students.filter(s => s.status === 'Holiday').length;
  const leave = state.students.filter(s => s.status === 'Leave').length;

  // Unmarked elements (status is empty or has a default, but since we default to 'Present', unmarked is 0
  // unless we decide to support a "Pending" select state later).
  // Currently, standard status counts:
  DOM.statTotalVal.textContent = total;
  DOM.statPresentVal.textContent = present;
  DOM.statAbsentVal.textContent = absent;

  // Render unmarked/pending warning logic. In this app, the user has buttons to mark status.
  // The warning is for any unmarked, but since we default to 'Present', everything is pre-marked.
  // If we add other statuses to unmarked:
  const unmarked = total - (present + absent + late + holiday + leave);
  DOM.statPendingVal.textContent = unmarked;

  // Update action footer warning
  if (unmarked > 0) {
    DOM.unmarkedWarningText.innerHTML = `⚠️ <span style="color:var(--color-absent);">${unmarked}</span> students unmarked`;
  } else {
    // Show summary instead
    const activeStatesText = [];
    if (present > 0) activeStatesText.push(`${present} Present`);
    if (absent > 0) activeStatesText.push(`${absent} Absent`);
    if (late > 0) activeStatesText.push(`${late} Late`);
    if (holiday > 0) activeStatesText.push(`${holiday} Holiday`);
    if (leave > 0) activeStatesText.push(`${leave} Leave`);

    DOM.unmarkedWarningText.innerHTML = `✓ Ready: ` + activeStatesText.join(', ');
  }
}

// --- Save & Reset Actions ---
function initSaveAndResetActions() {
  DOM.resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all attendance markings back to "Present"?')) {
      state.students.forEach(student => {
        student.status = 'Present';
      });
      renderStudentList();
      updateStatsSummary();
      showToast('Attendance choices reset to Present.', 'info');
    }
  });

  DOM.saveBtn.addEventListener('click', saveAttendance);
}

// --- Success Screen Actions ---
function initSuccessActions() {
  // "Take Attendance Again": keep center, reset batch & student list
  DOM.successAgainBtn.addEventListener('click', () => {
    DOM.successSection.style.display = 'none';

    const savedCenter = state.schoolCenter;
    resetSelectionState();

    // Re-show the batch selector for the saved center
    if (savedCenter) {
      DOM.batchSelectorRow.style.display = 'block';
      loadBatches(savedCenter);
    }

    DOM.welcomeSection.style.display = 'flex';
  });

  // "Edit Submission": return to student list with markings intact
  DOM.successEditBtn.addEventListener('click', () => {
    hideSuccessScreen();
  });

  // "Exit": full reset — clear everything including center
  DOM.successExitBtn.addEventListener('click', () => {
    DOM.successSection.style.display = 'none';
    DOM.schoolCenterSelect.value = '';
    DOM.batchSelectorRow.style.display = 'none';
    resetSelectionState();
  });
}

function showSuccessScreen(sessionPayload) {
  // Populate summary fields
  DOM.successCenterVal.textContent = sessionPayload.schoolCenter || '—';
  DOM.successBatchVal.textContent = sessionPayload.center || '—';
  DOM.successDatetimeVal.textContent = `${sessionPayload.date} · ${sessionPayload.time}`;

  const total = sessionPayload.students.length;
  const present = sessionPayload.students.filter(s => s.status === 'Present').length;
  const absent = sessionPayload.students.filter(s => s.status === 'Absent').length;
  const other = total - present - absent;
  let statsText = `${total} students`;
  if (present > 0) statsText += ` · ${present} Present`;
  if (absent > 0) statsText += ` · ${absent} Absent`;
  if (other > 0) statsText += ` · ${other} Other`;
  DOM.successStatsVal.textContent = statsText;

  // Transition views: hide attendance UI, show success screen
  DOM.attendanceSection.style.display = 'none';
  DOM.statsSummary.style.display = 'none';
  DOM.actionFooter.style.display = 'none';
  DOM.welcomeSection.style.display = 'none';
  DOM.successSection.style.display = 'flex';
}

function hideSuccessScreen() {
  DOM.successSection.style.display = 'none';
  DOM.statsSummary.style.display = 'grid';
  DOM.attendanceSection.style.display = 'block';
  DOM.actionFooter.style.display = 'block';
}

async function saveAttendance() {
  // Validations
  if (!state.selectedCenter) {
    showToast('Validation Error: No center selected.', 'error');
    return;
  }
  if (state.students.length === 0) {
    showToast('Validation Error: Student list is empty.', 'error');
    return;
  }

  // Start saving animation, disable buttons
  setSaveButtonState(true);

  // Read date/time from the user-editable inputs
  const dateStr = getSelectedDateString();
  const timeStr = getSelectedTimeString();

  const payload = {
    schoolCenter: state.schoolCenter || '',
    center: state.selectedCenter,
    date: dateStr,
    time: timeStr,
    students: state.students.map(s => ({
      name: s.name,
      status: s.status
    }))
  };

  if (state.mode === 'demo') {
    // Simulation lag
    setTimeout(() => {
      // Fetch current local sessions
      let sessions = [];
      try {
        sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_SESSIONS)) || [];
      } catch (e) {
        sessions = [];
      }

      // Store session payload
      sessions.push(payload);
      localStorage.setItem(STORAGE_KEYS.LOCAL_SESSIONS, JSON.stringify(sessions));

      setSaveButtonState(false);
      showSuccessScreen(payload);
    }, 1200);
  } else {
    // Live mode upload
    if (!state.apiUrl) {
      setSaveButtonState(false);
      showToast('Error: API URL is missing. Set it in Settings.', 'error');
      return;
    }

    try {
      // NOTE: Google Apps Script redirects POST requests, dropping the body.
      // We use a GET request with the payload URL-encoded to avoid this issue.
      const encodedPayload = encodeURIComponent(JSON.stringify(payload));
      const url = `${state.apiUrl}?action=save_attendance&payload=${encodedPayload}`;

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });

      const result = await response.json();
      if (result && result.success) {
        setSaveButtonState(false);
        showSuccessScreen(payload);
      } else {
        throw new Error(result.error || 'Server reported failure saving');
      }
    } catch (err) {
      console.error(err);
      setSaveButtonState(false);
      showToast(`Save failed: ${err.message || 'Check network connection'}`, 'error');
    }
  }
}

function setSaveButtonState(saving) {
  state.isSaving = saving;
  DOM.saveBtn.disabled = saving;
  DOM.resetBtn.disabled = saving;
  DOM.selectTrigger.style.pointerEvents = saving ? 'none' : 'auto';

  if (saving) {
    DOM.saveBtnText.textContent = 'Saving...';
    DOM.saveSpinner.style.display = 'inline-block';
    DOM.saveIcon.style.display = 'none';
  } else {
    DOM.saveBtnText.textContent = 'Save Attendance';
    DOM.saveSpinner.style.display = 'none';
    DOM.saveIcon.style.display = 'inline-block';
  }
}

// --- Notification Toasts System ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Automatically remove toast element after animations complete (4 seconds total)
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
