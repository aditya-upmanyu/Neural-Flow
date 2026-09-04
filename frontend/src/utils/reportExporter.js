import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export incident report as PDF
 * @param {Object} incident - Incident data
 * @param {Array} events - Related events
 * @param {Array} metrics - Metrics during incident
 */
export async function exportIncidentPDF(incident, events = [], metrics = []) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(0, 212, 255);
  pdf.text('NeuralFlow', 20, yPosition);
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Incident Report', 20, yPosition + 6);

  // Title
  yPosition += 20;
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Incident #${incident.id}`, 20, yPosition);

  // Metadata box
  yPosition += 10;
  pdf.setFillColor(245, 245, 250);
  pdf.rect(20, yPosition, pageWidth - 40, 35, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  yPosition += 7;
  
  pdf.text(`Status: ${incident.state || 'Unknown'}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`Started: ${new Date(incident.startTime).toLocaleString()}`, 25, yPosition);
  yPosition += 6;
  if (incident.endTime) {
    pdf.text(`Ended: ${new Date(incident.endTime).toLocaleString()}`, 25, yPosition);
    yPosition += 6;
  }
  pdf.text(`Duration: ${formatDuration(incident.duration || 0)}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`Affected Nodes: ${incident.affectedNodes?.join(', ') || 'None'}`, 25, yPosition);

  // Mitigation Strategy
  yPosition += 15;
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Mitigation Strategy', 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  const strategy = incident.mitigationStrategy || 'No mitigation applied';
  const strategyLines = pdf.splitTextToSize(strategy, pageWidth - 40);
  pdf.text(strategyLines, 20, yPosition);
  yPosition += strategyLines.length * 5 + 5;

  // AI Decision Details
  if (incident.aiDecision) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('AI Decision Details', 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Confidence: ${(incident.aiDecision.confidence * 100).toFixed(1)}%`, 25, yPosition);
    yPosition += 6;
    pdf.text(`Reasoning: ${incident.aiDecision.reasoning || 'N/A'}`, 25, yPosition);
    yPosition += 10;
  }

  // Events Timeline
  if (events.length > 0) {
    // Add new page if needed
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Event Timeline', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    events.slice(0, 15).forEach((event, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      const time = new Date(event.timestamp).toLocaleTimeString();
      const severity = event.severity || 'INFO';
      
      // Color code by severity
      if (severity === 'CRITICAL') pdf.setTextColor(255, 51, 85);
      else if (severity === 'WARN') pdf.setTextColor(245, 166, 35);
      else pdf.setTextColor(100, 100, 100);
      
      pdf.text(`[${time}] ${severity}`, 25, yPosition);
      pdf.setTextColor(60, 60, 60);
      
      const messageLines = pdf.splitTextToSize(event.message, pageWidth - 50);
      pdf.text(messageLines, 60, yPosition);
      yPosition += Math.max(messageLines.length * 4, 6);
    });
  }

  // Metrics Summary
  if (metrics.length > 0) {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Metrics Summary', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    const avgLatency = metrics.reduce((sum, m) => sum + (m.latency || 0), 0) / metrics.length;
    const avgCpu = metrics.reduce((sum, m) => sum + (m.cpu || 0), 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + (m.memory || 0), 0) / metrics.length;
    
    pdf.text(`Average Latency: ${avgLatency.toFixed(2)}ms`, 25, yPosition);
    yPosition += 6;
    pdf.text(`Average CPU: ${avgCpu.toFixed(1)}%`, 25, yPosition);
    yPosition += 6;
    pdf.text(`Average Memory: ${avgMemory.toFixed(1)}%`, 25, yPosition);
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Generated on ${new Date().toLocaleString()} | NeuralFlow 3.0`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save PDF
  const filename = `neuralflow-incident-${incident.id}-${Date.now()}.pdf`;
  pdf.save(filename);
  
  return filename;
}

/**
 * Export incident report as CSV
 * @param {Object} incident - Incident data
 * @param {Array} events - Related events
 */
export function exportIncidentCSV(incident, events = []) {
  const rows = [];
  
  // Header
  rows.push(['NeuralFlow V5 - Incident Report']);
  rows.push([]);
  
  // Incident metadata
  rows.push(['Field', 'Value']);
  rows.push(['Incident ID', incident.id]);
  rows.push(['Status', incident.state || 'Unknown']);
  rows.push(['Start Time', new Date(incident.startTime).toLocaleString()]);
  if (incident.endTime) {
    rows.push(['End Time', new Date(incident.endTime).toLocaleString()]);
  }
  rows.push(['Duration', formatDuration(incident.duration || 0)]);
  rows.push(['Affected Nodes', incident.affectedNodes?.join(', ') || 'None']);
  rows.push(['Mitigation Strategy', incident.mitigationStrategy || 'None']);
  
  if (incident.aiDecision) {
    rows.push(['AI Confidence', `${(incident.aiDecision.confidence * 100).toFixed(1)}%`]);
    rows.push(['AI Reasoning', incident.aiDecision.reasoning || 'N/A']);
  }
  
  rows.push([]);
  
  // Events
  if (events.length > 0) {
    rows.push(['Event Timeline']);
    rows.push(['Timestamp', 'Severity', 'Message']);
    
    events.forEach(event => {
      rows.push([
        new Date(event.timestamp).toLocaleString(),
        event.severity || 'INFO',
        event.message
      ]);
    });
  }
  
  // Convert to CSV string
  const csvContent = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `neuralflow-incident-${incident.id}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return `neuralflow-incident-${incident.id}-${Date.now()}.csv`;
}

/**
 * Export chart as image (for embedding in PDFs)
 * @param {HTMLElement} chartElement - Chart DOM element
 * @returns {Promise<string>} Base64 image data
 */
export async function exportChartAsImage(chartElement) {
  if (!chartElement) return null;
  
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#0f0f17',
      scale: 2,
      logging: false
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to export chart:', error);
    return null;
  }
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Batch export multiple incidents
 * @param {Array} incidents - Array of incidents
 * @param {Array} allEvents - All events
 * @param {string} format - 'pdf' or 'csv'
 */
export async function exportBatchIncidents(incidents, allEvents = [], format = 'pdf') {
  const exports = [];
  
  for (const incident of incidents) {
    const incidentEvents = allEvents.filter(e => 
      e.timestamp >= incident.startTime && 
      (!incident.endTime || e.timestamp <= incident.endTime)
    );
    
    if (format === 'pdf') {
      const filename = await exportIncidentPDF(incident, incidentEvents);
      exports.push(filename);
    } else {
      const filename = exportIncidentCSV(incident, incidentEvents);
      exports.push(filename);
    }
    
    // Small delay between exports to avoid browser throttling
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return exports;
}
