"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Database,
  Activity,
  Shield,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Ban,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { AuditAction } from "@prisma/client"
import {
  getAuditLogs,
  getAuditLogStats,
  type AuditLogEntry,
} from "@/lib/actions/audit-log-actions"
import { toast } from "sonner"

interface AuditLogManagementProps {
  businessUnitId: string
}

const getActionColor = (action: AuditAction) => {
  switch (action) {
    case AuditAction.CREATE:
      return "bg-green-100 text-green-800"
    case AuditAction.UPDATE:
      return "bg-blue-100 text-blue-800"
    case AuditAction.DELETE:
      return "bg-red-100 text-red-800"
    case AuditAction.LOGIN:
      return "bg-cyan-100 text-cyan-800"
    case AuditAction.LOGOUT:
      return "bg-gray-100 text-gray-800"
    case AuditAction.ACCESS_DENIED:
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getActionIcon = (action: AuditAction) => {
  switch (action) {
    case AuditAction.CREATE:
      return Plus
    case AuditAction.UPDATE:
      return Edit
    case AuditAction.DELETE:
      return Trash2
    case AuditAction.LOGIN:
      return LogIn
    case AuditAction.LOGOUT:
      return LogOut
    case AuditAction.ACCESS_DENIED:
      return Ban
    default:
      return Activity
  }
}

export function AuditLogManagement({ businessUnitId }: AuditLogManagementProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAction, setSelectedAction] = useState<string>("all")
  const [selectedTable, setSelectedTable] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<{
    totalLogs: number
    actionCounts: Record<AuditAction, number>
    tableCounts: Array<{ tableName: string; count: number }>
    userCounts: Array<{ userId: string; count: number }>
  } | null>(null)

  const itemsPerPage = 20

  // Get unique values for filters
  const uniqueTables = Array.from(new Set(auditLogs.map(log => log.tableName))).sort()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user?.name).filter(Boolean))).sort()

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      setIsLoading(true)
      const options = {
        ...(selectedAction !== "all" && { action: selectedAction as AuditAction }),
        ...(selectedTable !== "all" && { tableName: selectedTable }),
        ...(selectedUser !== "all" && { userId: selectedUser }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        limit: 1000, // Load more for client-side filtering
        offset: 0
      }

      const logs = await getAuditLogs(businessUnitId, options)
      setAuditLogs(logs)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      toast.error("Failed to load audit logs")
    } finally {
      setIsLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      const result = await getAuditLogStats(businessUnitId)
      if (result.success && result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error loading audit stats:", error)
    }
  }

  // Initial load
  useEffect(() => {
    loadAuditLogs()
    loadStats()
  }, [businessUnitId])

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = searchQuery === "" ||
      log.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedAction("all")
    setSelectedTable("all")
    setSelectedUser("all")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    loadAuditLogs()
    loadStats()
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Filters</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar Content */}
        {isSidebarOpen && (
          <div className="flex-1 p-4 space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Action</Label>
              <Select value={selectedAction} onValueChange={(value) => {
                setSelectedAction(value)
                resetToFirstPage()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value={AuditAction.CREATE}>
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2 text-green-500" />
                      Create
                    </div>
                  </SelectItem>
                  <SelectItem value={AuditAction.UPDATE}>
                    <div className="flex items-center">
                      <Edit className="w-4 h-4 mr-2 text-blue-500" />
                      Update
                    </div>
                  </SelectItem>
                  <SelectItem value={AuditAction.DELETE}>
                    <div className="flex items-center">
                      <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                      Delete
                    </div>
                  </SelectItem>
                  <SelectItem value={AuditAction.LOGIN}>
                    <div className="flex items-center">
                      <LogIn className="w-4 h-4 mr-2 text-cyan-500" />
                      Login
                    </div>
                  </SelectItem>
                  <SelectItem value={AuditAction.LOGOUT}>
                    <div className="flex items-center">
                      <LogOut className="w-4 h-4 mr-2 text-gray-500" />
                      Logout
                    </div>
                  </SelectItem>
                  <SelectItem value={AuditAction.ACCESS_DENIED}>
                    <div className="flex items-center">
                      <Ban className="w-4 h-4 mr-2 text-orange-500" />
                      Access Denied
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Filter */}
            {uniqueTables.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Table</Label>
                <Select value={selectedTable} onValueChange={(value) => {
                  setSelectedTable(value)
                  resetToFirstPage()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {uniqueTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          {table}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date Range</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>

            <Separator />

            {/* Quick Stats */}
            {stats && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </Label>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Logs:</span>
                    <span className="font-medium">{stats.totalLogs}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <span className="text-gray-600 text-xs font-medium">By Action:</span>
                    {Object.entries(stats.actionCounts).map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-gray-600 text-xs">{action}:</span>
                        <span className="font-medium text-xs">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">Monitor system activity and user actions</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                No audit logs match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Timestamp</TableHead>
                      <TableHead className="font-semibold">Action</TableHead>
                      <TableHead className="font-semibold">Table</TableHead>
                      <TableHead className="font-semibold">Record ID</TableHead>
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => {
                      const ActionIcon = getActionIcon(log.action)
                      return (
                        <TableRow key={log.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium">
                                  {log.createdAt.toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {log.createdAt.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              <ActionIcon className="w-3 h-3 mr-1" />
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Database className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{log.tableName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {log.recordId.substring(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium">{log.user.name}</div>
                                  <div className="text-xs text-gray-500">{log.user.email}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">System</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {log.ipAddress || "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredLogs.length} logs)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNum => {
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                      return false;
                    })
                    .map((pageNum, index, arr) => (
                      <div key={pageNum} className="flex items-center">
                        {index > 0 && pageNum > arr[index - 1] + 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      </div>
                    ))
                  }
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}