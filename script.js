// Main Application
class ReelScheduler {
    constructor() {
        this.videos = [];
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.autoSaveTimeout = null;
        this.isOnline = true;

        // API configuration
        // this.API_BASE_URL = 'http://localhost:3000/api';
        this.API_BASE_URL = '/api';

        this.init();
    }

    async init() {
        console.log('Initializing ReelScheduler...');
        await this.checkConnection();
        if (this.isOnline) {
            console.log('Online - loading from server');
            await this.loadFromServer();
        } else {
            console.log('Offline - loading from localStorage');
            this.loadFromLocalStorage();
        }
        this.setupEventListeners();
        this.render();
        this.startConnectionMonitor();
        console.log('Initialization complete. Videos loaded:', this.videos.length);
    }

    // 🔌 Connection Management
    async checkConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.API_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.isOnline = response.ok;
            return this.isOnline;
        } catch (error) {
            this.isOnline = false;
            console.log('Server offline, using local storage');
            return false;
        }
    }

    startConnectionMonitor() {
        // Check connection every 30 seconds
        setInterval(async () => {
            await this.checkConnection();
            this.updateConnectionStatus();
        }, 30000);
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) {
            const headerControls = document.querySelector('.header-controls');
            if (headerControls) {
                const statusDiv = document.createElement('div');
                statusDiv.id = 'connectionStatus';
                statusDiv.className = 'connection-status';
                headerControls.prepend(statusDiv);
            }
        }

        const element = document.getElementById('connectionStatus');
        if (element) {
            if (this.isOnline) {
                element.innerHTML = '<i class="fas fa-wifi text-success"></i> Online';
                element.className = 'connection-status online';
            } else {
                element.innerHTML = '<i class="fas fa-wifi-slash text-warning"></i> Offline';
                element.className = 'connection-status offline';
            }
        }
    }

    // 🗄️ Data Storage Methods
    async loadFromServer() {
        try {
            console.log('Attempting to load from server...');
            const response = await fetch(`${this.API_BASE_URL}/videos`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.videos = data.videos || [];
            console.log(`Loaded ${this.videos.length} videos from server`, this.videos);

            // Also save to local storage as backup
            this.saveToLocalStorage();

            return true;
        } catch (error) {
            console.error('Error loading from server:', error);
            return false;
        }
    }

    async saveToServer() {
        try {
            const data = {
                videos: this.videos,
                version: '1.0.0'
            };

            const response = await fetch(`${this.API_BASE_URL}/videos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('Data saved to server:', result.message);
            return true;
        } catch (error) {
            console.error('Error saving to server:', error);
            return false;
        }
    }

    saveToLocalStorage() {
        try {
            const data = {
                videos: this.videos,
                version: '1.0.0',
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('reelSchedulerData', JSON.stringify(data));
            console.log('Data saved to local storage');
        } catch (error) {
            console.error('Local storage save error:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('reelSchedulerData');
            if (saved) {
                const data = JSON.parse(saved);
                this.videos = data.videos || [];
                console.log(`Loaded ${this.videos.length} videos from local storage`, this.videos);
            } else {
                this.loadSampleData();
                console.log('Loaded sample data');
            }
        } catch (error) {
            console.error('Local storage load error:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        this.videos = [
            {
                id: 1,
                name: "Tauba Tauba",
                contentType: "Dance",
                shoot: "Done",
                edit: "Done",
                igUpload: "Uploaded",
                ytUpload: "Not",
                igDate: "2024-08-07",
                ytDate: "",
                views: 15000,
                likes: 1200,
                notes: "Good engagement, mostly female audience"
            },
            {
                id: 2,
                name: "APT",
                contentType: "Dance",
                shoot: "Done",
                edit: "Done",
                igUpload: "Uploaded",
                ytUpload: "Not",
                igDate: "2025-01-19",
                ytDate: "",
                views: 0,
                likes: 0,
                notes: ""
            },
            {
                id: 6,
                name: "Boyfriend-Karan Aujia",
                contentType: "Music",
                shoot: "Done",
                edit: "Done",
                igUpload: "Uploaded",
                ytUpload: "Scheduled",
                igDate: "2025-11-24",
                ytDate: "2026-01-18",
                views: 0,
                likes: 0,
                notes: ""
            },
            {
                id: 8,
                name: "Lover-Dijlir Dosanjh",
                contentType: "Music",
                shoot: "Done",
                edit: "Done",
                igUpload: "Uploaded",
                ytUpload: "Scheduled",
                igDate: "2025-12-07",
                ytDate: "2026-01-25",
                views: 0,
                likes: 0,
                notes: ""
            }
        ];
    }

    // 📌 CORE: Status System
    getStatusClass(status) {
        switch (status) {
            case 'Done':
            case 'Uploaded':
                return 'status-done';
            case 'Pending':
                return 'status-pending';
            case 'Scheduled':
                return 'status-scheduled';
            case 'Not':
                return 'status-not';
            default:
                return '';
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'Done':
            case 'Uploaded':
                return '<i class="fas fa-check-circle"></i>';
            case 'Pending':
                return '<i class="fas fa-clock"></i>';
            case 'Scheduled':
                return '<i class="fas fa-calendar-check"></i>';
            case 'Not':
                return '<i class="fas fa-times-circle"></i>';
            default:
                return '';
        }
    }

    // 📅 CORE: Upload Date Tracking
    getUpcomingReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const reminders = {
            today: [],
            tomorrow: [],
            overdue: []
        };

        this.videos.forEach(video => {
            // Check IG uploads
            if (video.igUpload === 'Scheduled' && video.igDate) {
                if (video.igDate === todayStr) {
                    reminders.today.push({
                        video: video.name,
                        platform: 'Instagram',
                        date: video.igDate
                    });
                } else if (video.igDate === tomorrowStr) {
                    reminders.tomorrow.push({
                        video: video.name,
                        platform: 'Instagram',
                        date: video.igDate
                    });
                } else if (video.igDate < todayStr) {
                    reminders.overdue.push({
                        video: video.name,
                        platform: 'Instagram',
                        date: video.igDate
                    });
                }
            }

            // Check YT uploads
            if (video.ytUpload === 'Scheduled' && video.ytDate) {
                if (video.ytDate === todayStr) {
                    reminders.today.push({
                        video: video.name,
                        platform: 'YouTube',
                        date: video.ytDate
                    });
                } else if (video.ytDate === tomorrowStr) {
                    reminders.tomorrow.push({
                        video: video.name,
                        platform: 'YouTube',
                        date: video.ytDate
                    });
                } else if (video.ytDate < todayStr) {
                    reminders.overdue.push({
                        video: video.name,
                        platform: 'YouTube',
                        date: video.ytDate
                    });
                }
            }
        });

        return reminders;
    }

    // 🔍 CORE: Search & Filter
    filterVideos() {
        let filtered = [...this.videos];

        // Apply search
        if (this.currentSearch) {
            const searchTerm = this.currentSearch.toLowerCase();
            filtered = filtered.filter(video =>
                video.name.toLowerCase().includes(searchTerm) ||
                (video.contentType && video.contentType.toLowerCase().includes(searchTerm)) ||
                (video.notes && video.notes.toLowerCase().includes(searchTerm))
            );
        }

        // Apply filter
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        switch (this.currentFilter) {
            case 'shoot-pending':
                filtered = filtered.filter(v => v.shoot === 'Pending');
                break;
            case 'edit-pending':
                filtered = filtered.filter(v => (v.edit === 'Pending') && (v.shoot === 'Done') );
                break;
            case 'upload-today':
                filtered = filtered.filter(v =>
                    (v.igUpload === 'Scheduled' && v.igDate === today) ||
                    (v.ytUpload === 'Scheduled' && v.ytDate === today)
                );
                break;
            case 'Overdue':
                filtered = filtered.filter(v =>
                    (v.igUpload === 'Scheduled' && v.igDate < today) ||
                    (v.ytUpload === 'Scheduled' && v.ytDate < today)
                );
                break;
            case 'Scheduled':
                filtered = filtered.filter(v =>
                    (v.igUpload === 'Scheduled' && v.igDate && v.igDate >= today) ||
                    (v.ytUpload === 'Scheduled' && v.ytDate && v.ytDate >= today)
                );
                break;
            case 'IGUploaded':
                filtered = filtered.filter(v =>
                    (v.igUpload === 'Uploaded') 
                );
                break;
            case 'YTUploaded':
                filtered = filtered.filter(v =>
                    (v.ytUpload === 'Uploaded')
                );
                break;
            case 'not-uploaded':
                filtered = filtered.filter(v =>
                    v.igUpload === 'Not' || v.ytUpload === 'Not'
                );
                break;
            case 'all':
            default:
                // Show all videos
                break;
        }

        return filtered;
    }

    // 📊 CORE: Progress Tracker
    calculateStats() {
        const total = this.videos.length;
        const edited = this.videos.filter(v => v.edit === 'Done').length;
        const igUploaded = this.videos.filter(v => v.igUpload === 'Uploaded').length;
        const ytUploaded = this.videos.filter(v => v.ytUpload === 'Uploaded').length;

        return { total, edited, igUploaded, ytUploaded };
    }

    // 🚀 Feature: Duplicate Video
    duplicateVideo(id) {
        const video = this.videos.find(v => v.id === id);
        if (video) {
            const newVideo = { ...video };
            newVideo.id = this.getNextId();
            newVideo.name = `${video.name} (Copy)`;
            newVideo.igUpload = 'Not';
            newVideo.ytUpload = 'Not';
            newVideo.igDate = '';
            newVideo.ytDate = '';
            newVideo.views = 0;
            newVideo.likes = 0;
            newVideo.notes = '';

            this.videos.push(newVideo);
            this.save();
            this.render();

            this.showNotification('Video duplicated successfully!', 'success');
        }
    }

    getNextId() {
        if (this.videos.length === 0) return 1;
        return Math.max(...this.videos.map(v => v.id)) + 1;
    }

    // 📅 Feature: Calendar View
    renderCalendar() {
        const container = document.getElementById('calendarContainer');
        if (!container) return;

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        document.getElementById('currentMonth').textContent =
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();

        let calendarHTML = '<div class="calendar-grid">';

        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day &&
                today.getMonth() === this.currentMonth &&
                today.getFullYear() === this.currentYear;

            // Find events for this day

            // const events = this.videos.filter(v =>
            //     (v.igUpload === 'Scheduled' && v.igDate === dateStr) ||
            //     (v.ytUpload === 'Scheduled' && v.ytDate === dateStr)
            // );
            const events = this.videos.filter(v =>
                (v.igDate === dateStr && (v.igUpload === 'Scheduled' || v.igUpload === 'Uploaded')) ||
                (v.ytDate === dateStr && (v.ytUpload === 'Scheduled' || v.ytUpload === 'Uploaded'))
            );

            calendarHTML += `
                <div class="calendar-day">
                    <div class="calendar-date ${isToday ? 'today' : ''}">${day}</div>
            `;

            // events.forEach(event => {
            //     if (event.igUpload === 'Scheduled' && event.igDate === dateStr) {
            //         calendarHTML += `
            //             <div class="calendar-event ig" title="${event.name} - Instagram">
            //                 <i class="fab fa-instagram"></i> ${event.name.substring(0, 10)}${event.name.length > 10 ? '...' : ''}
            //             </div>
            //         `;
            //     }
            //     if (event.ytUpload === 'Scheduled' && event.ytDate === dateStr) {
            //         calendarHTML += `
            //             <div class="calendar-event yt" title="${event.name} - YouTube">
            //                 <i class="fab fa-youtube"></i> ${event.name.substring(0, 10)}${event.name.length > 10 ? '...' : ''}
            //             </div>
            //         `;
            //     }
            // });

            events.forEach(event => {

                // Instagram
                if (event.igDate === dateStr) {
                    const isUploaded = event.igUpload === 'Uploaded';

                    calendarHTML += `
            <div class="calendar-event ig ${isUploaded ? 'uploaded' : 'scheduled'}"
                 title="${event.name} - Instagram (${event.igUpload})">
                <i class="fab fa-instagram"></i>
                
                ${event.name.substring(0, 10)}${event.name.length > 10 ? '...' : ''}
            </div>
        `;
                }

                // YouTube
                if (event.ytDate === dateStr) {
                    const isUploaded = event.ytUpload === 'Uploaded';

                    calendarHTML += `
            <div class="calendar-event yt ${isUploaded ? 'uploaded' : 'scheduled'}"
                 title="${event.name} - YouTube (${event.ytUpload})">
                <i class="fab fa-youtube"></i>
                
                ${event.name.substring(0, 10)}${event.name.length > 10 ? '...' : ''}
            </div>
        `;
                }

            });


            calendarHTML += '</div>';
        }

        calendarHTML += '</div>';
        container.innerHTML = calendarHTML;
    }

    // 📈 Feature: Performance Analytics
    showPerformanceModal(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) return;

        const modalContent = document.getElementById('performanceContent');
        modalContent.innerHTML = `
            <h6>${video.name}</h6>
            <p class="text-muted">${video.contentType}</p>
            
            <div class="row mb-3">
                <div class="col-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <h3>${video.views || 0}</h3>
                            <p class="text-muted mb-0">Views</p>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <h3>${video.likes || 0}</h3>
                            <p class="text-muted mb-0">Likes</p>
                        </div>
                    </div>
                </div>
            </div>
            
            ${video.views > 0 ? `
                <div class="mb-3">
                    <strong>Engagement Rate:</strong> 
                    ${((video.likes / video.views) * 100).toFixed(1)}%
                </div>
            ` : ''}
            
            ${video.notes ? `
                <div class="mb-3">
                    <strong>Notes:</strong>
                    <p>${video.notes}</p>
                </div>
            ` : '<p class="text-muted">No notes added yet.</p>'}
            
            <div class="mt-4">
                <button class="btn btn-sm btn-outline-primary" onclick="scheduler.editVideo(${videoId})">
                    <i class="fas fa-edit me-1"></i> Edit Performance Data
                </button>
            </div>
        `;

        new bootstrap.Modal(document.getElementById('performanceModal')).show();
    }

    // 💾 Feature: Export & Import
    exportData() {
        try {
            const data = {
                videos: this.videos,
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                source: this.isOnline ? 'server' : 'local'
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `reel-scheduler-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 100);

            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export data', 'error');
        }
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.videos && Array.isArray(data.videos)) {
                    this.videos = data.videos;
                    await this.save();
                    this.render();
                    this.showNotification('Data imported successfully!', 'success');

                    // Close modal
                    const importModal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
                    if (importModal) importModal.hide();
                } else {
                    throw new Error('Invalid file format - missing videos array');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // 🧠 Main Render Function
    render() {
        console.log('Rendering...', this.videos.length, 'videos');
        this.renderTable();
        this.renderStats();
        this.renderCalendar();
    }

    renderTable() {
        const tbody = document.getElementById('videoTableBody');
        if (!tbody) {
            console.error('Table body not found!');
            return;
        }

        const filteredVideos = this.filterVideos();
        console.log('Filtered videos:', filteredVideos.length);

        if (filteredVideos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-film fa-2x mb-3"></i>
                            <h5>No videos found</h5>
                            <p class="text-muted">${this.currentSearch ? 'Try a different search term' : 'Add your first video to get started'}</p>
                            ${!this.currentSearch ? `<button class="btn btn-primary mt-2" onclick="scheduler.addVideo()">
                                <i class="fas fa-plus me-1"></i> Add First Video
                            </button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredVideos.map(video => `
            <tr class="fade-in">
                <td>${video.id}</td>
                <td>
                    <strong>${video.name}</strong>
                    ${video.notes ? '<i class="fas fa-sticky-note ms-1 text-warning" title="Has notes"></i>' : ''}
                </td>
                <td>
                    <span class="content-type-tag content-type-${video.contentType ? video.contentType.toLowerCase().replace(' ', '-') : 'other'}">
                        ${video.contentType || 'Other'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(video.shoot)}">
                        ${this.getStatusIcon(video.shoot)} ${video.shoot || 'Pending'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(video.edit)}">
                        ${this.getStatusIcon(video.edit)} ${video.edit || 'Pending'}
                    </span>
                </td>
                <td>
                    <span class="platform-badge ig">
                        ${this.getStatusIcon(video.igUpload)} ${video.igUpload || 'Not'}
                    </span>
                    ${video.igDate ? `<br><small>${this.formatDate(video.igDate)}</small>` : ''}
                </td>
                <td>
                    <span class="platform-badge yt">
                        ${this.getStatusIcon(video.ytUpload)} ${video.ytUpload || 'Not'}
                    </span>
                    ${video.ytDate ? `<br><small>${this.formatDate(video.ytDate)}</small>` : ''}
                </td>
                <td>
                    <small class="d-block">
                        <strong>IG:</strong> ${video.igDate ? this.formatDate(video.igDate) : 'Not set'}
                    </small>
                    <small class="d-block">
                        <strong>YT:</strong> ${video.ytDate ? this.formatDate(video.ytDate) : 'Not set'}
                    </small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" title="Edit" onclick="scheduler.editVideo(${video.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn duplicate" title="Duplicate" onclick="scheduler.duplicateVideo(${video.id})">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn performance" title="Performance" onclick="scheduler.showPerformanceModal(${video.id})">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="scheduler.deleteVideo(${video.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        console.log('Table rendered with', filteredVideos.length, 'rows');
    }

    renderStats() {
        const stats = this.calculateStats();

        console.log('Stats:', stats);

        // Update stats cards
        document.getElementById('totalVideos').textContent = stats.total;
        document.getElementById('editedVideos').textContent = stats.edited;
        document.getElementById('igUploaded').textContent = stats.igUploaded;
        document.getElementById('ytUploaded').textContent = stats.ytUploaded;
    }

    // 📝 Feature: Add/Edit Video - FIXED
    addVideo() {
        console.log('Add video button clicked');
        document.getElementById('modalTitle').textContent = 'Add New Video';
        document.getElementById('videoId').value = '';

        // Reset form
        const form = document.getElementById('videoForm');
        if (form) form.reset();

        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const igDateInput = document.getElementById('igDate');
        const ytDateInput = document.getElementById('ytDate');
        if (igDateInput) igDateInput.value = today;
        if (ytDateInput) ytDateInput.value = today;

        // Hide delete button
        const deleteBtn = document.getElementById('deleteVideoBtn');
        if (deleteBtn) deleteBtn.style.display = 'none';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('videoModal'));
        modal.show();
    }

    editVideo(id) {
        console.log('Edit video:', id);
        const video = this.videos.find(v => v.id === id);
        if (!video) {
            console.error('Video not found:', id);
            return;
        }

        document.getElementById('modalTitle').textContent = 'Edit Video';
        document.getElementById('videoId').value = video.id;
        document.getElementById('videoName').value = video.name || '';
        document.getElementById('contentType').value = video.contentType || 'Other';
        document.getElementById('shootStatus').value = video.shoot || 'Pending';
        document.getElementById('editStatus').value = video.edit || 'Pending';
        document.getElementById('igUpload').value = video.igUpload || 'Not';
        document.getElementById('ytUpload').value = video.ytUpload || 'Not';
        document.getElementById('igDate').value = video.igDate || '';
        document.getElementById('ytDate').value = video.ytDate || '';
        document.getElementById('views').value = video.views || '';
        document.getElementById('likes').value = video.likes || '';
        document.getElementById('notes').value = video.notes || '';

        // Show delete button
        const deleteBtn = document.getElementById('deleteVideoBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.onclick = () => this.deleteVideo(id);
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('videoModal'));
        modal.show();
    }

    async saveVideo() {
        console.log('Saving video...');
        const id = document.getElementById('videoId').value;
        const videoName = document.getElementById('videoName').value;

        if (!videoName) {
            alert('Video name is required');
            return;
        }

        const videoData = {
            name: videoName,
            contentType: document.getElementById('contentType').value,
            shoot: document.getElementById('shootStatus').value,
            edit: document.getElementById('editStatus').value,
            igUpload: document.getElementById('igUpload').value,
            ytUpload: document.getElementById('ytUpload').value,
            igDate: document.getElementById('igDate').value || '',
            ytDate: document.getElementById('ytDate').value || '',
            views: parseInt(document.getElementById('views').value) || 0,
            likes: parseInt(document.getElementById('likes').value) || 0,
            notes: document.getElementById('notes').value
        };

        if (id) {
            // Update existing video
            const index = this.videos.findIndex(v => v.id === parseInt(id));
            if (index !== -1) {
                this.videos[index] = { ...this.videos[index], ...videoData };
                console.log('Updated video:', this.videos[index]);
            }
        } else {
            // Add new video
            videoData.id = this.getNextId();
            this.videos.push(videoData);
            console.log('Added new video:', videoData);
        }

        await this.save();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('videoModal'));
        if (modal) modal.hide();

        this.showNotification(`Video ${id ? 'updated' : 'added'} successfully!`, 'success');
    }

    async deleteVideo(id) {
        if (confirm('Are you sure you want to delete this video?')) {
            const initialLength = this.videos.length;
            this.videos = this.videos.filter(v => v.id !== id);

            if (this.videos.length < initialLength) {
                await this.save();
                this.showNotification('Video deleted successfully!', 'success');

                // Close modal if open
                const modal = bootstrap.Modal.getInstance(document.getElementById('videoModal'));
                if (modal) modal.hide();
            }
        }
    }

    async clearAllData() {
        if (confirm('⚠️ WARNING: This will delete ALL videos and cannot be undone. Continue?')) {
            this.videos = [];
            await this.save();
            this.showNotification('All data cleared!', 'success');

            const modal = bootstrap.Modal.getInstance(document.getElementById('clearModal'));
            if (modal) modal.hide();
        }
    }

    async syncData() {
        if (this.isOnline) {
            try {
                this.showNotification('Syncing data with server...', 'info');
                const serverSaved = await this.saveToServer();
                if (serverSaved) {
                    this.showNotification('Data synced with server', 'success');
                } else {
                    this.showNotification('Sync failed', 'error');
                }
            } catch (error) {
                console.error('Sync error:', error);
                this.showNotification('Sync failed: ' + error.message, 'error');
            }
        } else {
            this.showNotification('Cannot sync - offline', 'warning');
        }
    }

    // 💾 Updated Save Method
    async save() {
        console.log('Saving data...');
        // Save to local storage immediately for responsiveness
        this.saveToLocalStorage();

        // Try to save to server if online (async, don't wait)
        if (this.isOnline) {
            this.saveToServer().then(success => {
                if (success) {
                    console.log('Auto-saved to server');
                }
            });
        }

        this.render();
    }

    // 🛠️ Utility Functions
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return dateString;
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';

        const typeClass = type === 'success' ? 'alert-success' :
            type === 'error' ? 'alert-danger' :
                type === 'warning' ? 'alert-warning' : 'alert-info';

        notification.innerHTML = `
            <div class="alert ${typeClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-triangle' :
                    type === 'warning' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // 🎯 Event Listeners Setup - FIXED
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Add video button - FIXED
        const addVideoBtn = document.getElementById('addVideoBtn');
        if (addVideoBtn) {
            addVideoBtn.addEventListener('click', () => this.addVideo());
            console.log('Add video button listener added');
        } else {
            console.error('Add video button not found!');
        }

        // Save video button
        const saveVideoBtn = document.getElementById('saveVideoBtn');
        if (saveVideoBtn) {
            saveVideoBtn.addEventListener('click', () => this.saveVideo());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Import button
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const fileInput = document.getElementById('importFile');
                if (fileInput && fileInput.files.length > 0) {
                    this.importData(fileInput.files[0]);
                } else {
                    alert('Please select a file to import');
                }
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.renderTable();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTable();
            });
        });

        // Calendar navigation
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.renderCalendar();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderCalendar();
            });
        }

        // Clear all data
        const confirmClearBtn = document.getElementById('confirmClearBtn');
        if (confirmClearBtn) {
            confirmClearBtn.addEventListener('click', () => this.clearAllData());
        }

        // Add sync button to header
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            const syncBtn = document.createElement('button');
            syncBtn.className = 'btn btn-light btn-sm me-2';
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sync';
            syncBtn.addEventListener('click', () => this.syncData());
            headerControls.prepend(syncBtn);
        }

        // Auto-save on form changes
        document.addEventListener('change', () => {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => {
                this.save();
            }, 1000);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }

            // Ctrl/Cmd + N to add new video
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.addVideo();
            }

            // Ctrl/Cmd + F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal.show');
                modals.forEach(modal => {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) bsModal.hide();
                });
            }
        });

        // Update connection status UI
        this.updateConnectionStatus();

        console.log('Event listeners setup complete');
    }
}

// Initialize the application
let scheduler;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing scheduler...');
    scheduler = new ReelScheduler();
    window.scheduler = scheduler;
    console.log('Scheduler initialized and available as window.scheduler');
});

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
    .connection-status {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 0.5rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .connection-status.online {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .connection-status.offline {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .calendar-day.empty {
        background: transparent;
        border: none;
    }
    
    /* Fix for small screens */
    @media (max-width: 768px) {
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }
        
        .action-btn {
            width: 28px;
            height: 28px;
            font-size: 0.8rem;
        }
    }
    
    /* Loading state for table */
    .table-loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    /* Content type tags fix */
    .content-type-tag {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        display: inline-block;
        white-space: nowrap;
    }
    
    .content-type-dance {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }
    
    .content-type-vlog {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    
    .content-type-bts {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }
    
    .content-type-motivation {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
    }
    
    .content-type-brand-collab {
        background: rgba(236, 72, 153, 0.1);
        color: #ec4899;
    }
    
    .content-type-tutorial {
        background: rgba(6, 182, 212, 0.1);
        color: #06b6d4;
    }
    
    .content-type-music {
        background: rgba(168, 85, 247, 0.1);
        color: #a855f7;
    }
    
    .content-type-other {
        background: rgba(107, 114, 128, 0.1);
        color: #6b7280;
    }
`;

document.head.appendChild(style);
