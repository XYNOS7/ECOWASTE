"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, RefreshCw } from "lucide-react"
import { database } from "@/lib/database"

export function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const filters = [
    { id: "all", label: "All Reports", color: "bg-gray-500" },
    { id: "waste", label: "Waste Reports", color: "bg-orange-500" },
    { id: "dirty", label: "Dirty Areas", color: "bg-red-500" },
    { id: "cleaned", label: "Cleaned Areas", color: "bg-green-500" },
  ]

  const fetchReports = async () => {
    try {
      const [wasteReports, dirtyAreaReports] = await Promise.all([
        database.wasteReports.getAll(),
        database.dirtyAreaReports.getAll(),
      ])

      const allReports = [
        ...(wasteReports.data || []).map((report) => ({
          ...report,
          type: "waste",
          status_color: getStatusColor(report.status),
        })),
        ...(dirtyAreaReports.data || []).map((report) => ({
          ...report,
          type: "dirty",
          status_color: getStatusColor(report.status),
        })),
      ]

      // Sort by creation date (newest first)
      allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setReports(allReports)
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "collected":
      case "cleaned":
        return "bg-green-500"
      case "in-progress":
        return "bg-yellow-500"
      case "pending":
      case "reported":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReports()
    setRefreshing(false)
  }

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      await fetchReports()
      setLoading(false)
    }

    loadReports()

    // Auto-refresh every 60 seconds for real-time updates
    const interval = setInterval(fetchReports, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredReports = reports.filter((report) => {
    if (selectedFilter === "all") return true
    if (selectedFilter === "waste") return report.type === "waste"
    if (selectedFilter === "dirty") return report.type === "dirty"
    if (selectedFilter === "cleaned") return report.status === "cleaned" || report.status === "collected"
    return true
  })

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold">Live Waste Map</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(filter.id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <div className={`w-3 h-3 rounded-full ${filter.color}`} />
            {filter.label}
          </Button>
        ))}
      </motion.div>

      {/* Map Placeholder */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="h-64 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <CardContent className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Interactive map will be displayed here</p>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredReports.length} real reports from users
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Real Reports List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          <Badge variant="outline">{filteredReports.length} reports</Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.slice(0, 10).map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {report.image_url ? (
                        <img
                          src={report.image_url || "/placeholder.svg"}
                          alt={report.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${report.status_color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{report.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {report.type === "waste" ? "Waste" : "Dirty Area"}
                        </Badge>
                        <Badge
                          variant={report.status === "collected" || report.status === "cleaned" ? "default" : "outline"}
                          className="text-xs"
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.location_address || "Location not specified"}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-muted-foreground">By: {report.profiles?.username || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        {report.coins_earned > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{report.coins_earned} coins
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (report.location_lat && report.location_lng) {
                          // Open Google Maps with the specific coordinates
                          const mapsUrl = `https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`
                          window.open(mapsUrl, '_blank')
                        } else if (report.location_address) {
                          // Fallback to address search if coordinates are not available
                          const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(report.location_address)}`
                          window.open(mapsUrl, '_blank')
                        } else {
                          // Show alert if no location data is available
                          alert('Location data not available for this report')
                        }
                      }}
                      title="Open in Google Maps"
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground">
              {selectedFilter === "all"
                ? "Be the first to report waste in your area!"
                : `No ${selectedFilter} reports found.`}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}