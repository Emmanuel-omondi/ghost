let usageChart, timelineChart;

function initCharts(data) {
    const ctx1 = document.getElementById('usageChart')?.getContext('2d');
    const ctx2 = document.getElementById('timelineChart')?.getContext('2d');
    
    if (ctx1) {
        usageChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['WhatsApp', 'Instagram', 'Calls', 'Browsing'],
                datasets: [{
                    data: [65, 25, 10, 20],
                    backgroundColor: ['#25D366', '#E4405F', '#10B981', '#3B82F6']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    
    if (ctx2) {
        timelineChart = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['09:00', '12:00', '15:00', '18:00', '21:00'],
                datasets: [{
                    label: 'Activity',
                    data: [12, 25, 18, 35, 22],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}