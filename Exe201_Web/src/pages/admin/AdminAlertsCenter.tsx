import React, { useState } from 'react'
import { AlertTriangle, Clock, MapPin, Camera, Filter, CheckCircle, X, Eye } from 'lucide-react'

const AdminAlertsCenter: React.FC = () => {
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const alerts = [
    {
      id: 1,
      child: 'Emma Johnson',
      class: 'Kindergarten A',
      type: 'Climbing',
      severity: 'High',
      time: '10:30 AM',
      date: '2024-01-15',
      location: 'Playground',
      description: 'Child detected climbing on unsafe playground equipment',
      status: 'pending',
      hasMedia: true,
      teacher: 'Sarah Johnson'
    },
    {
      id: 2,
      child: 'Michael Chen',
      class: 'Grade 1B',
      type: 'Out of Zone',
      severity: 'Medium',
      time: '9:45 AM',
      date: '2024-01-15',
      location: 'Hallway',
      description: 'Child moved outside designated safe area during class time',
      status: 'confirmed',
      hasMedia: false,
      teacher: 'David Wilson'
    },
    {
      id: 3,
      child: 'Sofia Rodriguez',
      class: 'Kindergarten B',
      type: 'Collision Risk',
      severity: 'High',
      time: '9:15 AM',
      date: '2024-01-15',
      location: 'Cafeteria',
      description: 'Potential collision detected with another child during lunch',
      status: 'resolved',
      hasMedia: true,
      teacher: 'Michael Chen'
    },
    {
      id: 4,
      child: 'Alex Thompson',
      class: 'Grade 1A',
      type: 'Wandering',
      severity: 'Low',
      time: '8:30 AM',
      date: '2024-01-14',
      location: 'Classroom',
      description: 'Child showing wandering behavior pattern during activity time',
      status: 'pending',
      hasMedia: false,
      teacher: 'Emily Davis'
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-danger-100 text-danger-700'
      case 'Medium': return 'bg-warning-100 text-warning-700'
      case 'Low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-100 text-warning-700'
      case 'confirmed': return 'bg-primary-100 text-primary-700'
      case 'resolved': return 'bg-success-100 text-success-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === 'all' || alert.type.toLowerCase().includes(filterType.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || alert.severity.toLowerCase() === filterSeverity.toLowerCase()
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus
    return matchesType && matchesSeverity && matchesStatus
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">System Alerts Center</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all safety alerts across the system</p>
      </header>

      {/* Filters */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
            <select
              className="input-field"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              title="Select alert type filter"
            >
              <option value="all">All Types</option>
              <option value="climbing">Climbing</option>
              <option value="out-of-zone">Out of Zone</option>
              <option value="collision">Collision Risk</option>
              <option value="wandering">Wandering</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              className="input-field"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              title="Select severity filter"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Select status filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select className="input-field" title="Select class filter">
              <option value="all">All Classes</option>
              <option value="kg-a">Kindergarten A</option>
              <option value="kg-b">Kindergarten B</option>
              <option value="g1-a">Grade 1A</option>
              <option value="g1-b">Grade 1B</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select className="input-field" title="Select date range filter">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </section>

      {/* Alert Statistics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-3xl font-bold text-warning-600">
                {alerts.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-full">
              <Clock className="w-8 h-8 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-3xl font-bold text-danger-600">
                {alerts.filter(a => a.severity === 'High').length}
              </p>
            </div>
            <div className="p-3 bg-danger-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-danger-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-3xl font-bold text-success-600">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Alerts List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">System Alerts</h2>
          <span className="text-sm text-gray-500">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </span>
        </div>

        {filteredAlerts.map((alert) => (
          <article key={alert.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${alert.severity === 'High' ? 'text-danger-500' :
                      alert.severity === 'Medium' ? 'text-warning-500' :
                        'text-gray-500'
                    }`} />
                  <h3 className="text-lg font-semibold text-gray-900">{alert.type}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Child & Class</p>
                    <p className="font-medium text-gray-900">{alert.child} ({alert.class})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teacher</p>
                    <p className="font-medium text-gray-900">{alert.teacher}</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-3">{alert.description}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{alert.time} - {alert.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{alert.location}</span>
                  </div>
                  {alert.hasMedia && (
                    <div className="flex items-center space-x-1">
                      <Camera className="w-4 h-4" />
                      <span>Media Available</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {alert.hasMedia && (
                  <button className="btn-secondary flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Media</span>
                  </button>
                )}
                <button className="btn-primary">
                  View Details
                </button>
              </div>
            </div>

            {alert.status === 'pending' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Admin Actions:</p>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Alert</span>
                    </button>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-warning-100 text-warning-700 rounded-lg hover:bg-warning-200 transition-colors">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Escalate</span>
                    </button>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-danger-100 text-danger-700 rounded-lg hover:bg-danger-200 transition-colors">
                      <X className="w-4 h-4" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full mt-2 p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Add admin notes or action taken..."
                  rows={2}
                />
              </div>
            )}
          </article>
        ))}
      </section>

      {/* Bulk Actions */}
      <section className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-success-50 hover:bg-success-100 rounded-lg text-center transition-colors">
            <CheckCircle className="w-6 h-6 text-success-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-success-700">Mark All as Reviewed</span>
          </button>

          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-center transition-colors">
            <AlertTriangle className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-primary-700">Export Alert Report</span>
          </button>

          <button className="p-4 bg-warning-50 hover:bg-warning-100 rounded-lg text-center transition-colors">
            <Clock className="w-6 h-6 text-warning-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-warning-700">Send Notifications</span>
          </button>

          <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
            <Filter className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
          </button>
        </div>
      </section>
    </div>
  )
}

export default AdminAlertsCenter
