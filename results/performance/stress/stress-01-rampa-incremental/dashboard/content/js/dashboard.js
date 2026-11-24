/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 94.10260879669978, "KoPercent": 5.897391203300215};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.11279123816164081, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.10760887985087274, 500, 1500, "02 Categoría Clothes"], "isController": false}, {"data": [0.09641255605381166, 500, 1500, "03 Búsqueda"], "isController": false}, {"data": [0.09428665785997357, 500, 1500, "01 Home"], "isController": false}, {"data": [0.14400778898920163, 500, 1500, "04 Detalle de producto"], "isController": false}, {"data": [0.14226973684210525, 500, 1500, "06 Ver carrito"], "isController": false}, {"data": [0.09475297511720158, 500, 1500, "05 Agregar al carrito (AJAX)"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 34422, 2030, 5.897391203300215, 6761.168845505803, 16, 30014, 2566.0, 29980.600000000006, 30001.0, 30002.0, 47.275758778537885, 3025.5667643845686, 40.98488406558204], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["02 Categoría Clothes", 5901, 521, 8.829012031859007, 7462.610235553285, 26, 30003, 2645.0, 28201.4, 30001.0, 30002.0, 8.113024146592627, 630.9961436153758, 5.028019561448493], "isController": false}, {"data": ["03 Búsqueda", 5798, 197, 3.3977233528803037, 4716.373922042078, 23, 30004, 2732.5, 6356.800000000007, 25801.850000000006, 30002.0, 7.982784281707749, 466.7964165092219, 7.497102714755897], "isController": false}, {"data": ["01 Home", 6056, 1228, 20.277410832232498, 19545.857166446473, 16, 30014, 23115.5, 30001.0, 30002.0, 30002.0, 8.317584494352394, 641.6923171875686, 1.100848565985804], "isController": false}, {"data": ["04 Detalle de producto", 5649, 63, 1.1152416356877324, 2923.1046202867683, 23, 30002, 2109.0, 3639.0, 4655.5, 30001.0, 7.787663811143983, 760.3527703831656, 8.23677232766916], "isController": false}, {"data": ["06 Ver carrito", 5472, 10, 0.1827485380116959, 2143.2887426900597, 20, 30002, 2074.0, 3323.7999999999993, 3849.449999999996, 5282.509999999994, 7.5616247543715644, 459.0187734530245, 8.723173740921075], "isController": false}, {"data": ["05 Agregar al carrito (AJAX)", 5546, 11, 0.1983411467724486, 2657.798413270827, 18, 30002, 2407.0, 3762.500000000001, 4324.549999999997, 20559.30999999997, 7.653930816525093, 74.56050610599713, 10.558063901213782], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 9, 0.4433497536945813, 0.026146069374237406], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 31, 1.5270935960591132, 0.09005868340015107], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1990, 98.0295566502463, 5.781186450525826], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 34422, 2030, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1990, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 31, "Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 9, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["02 Categoría Clothes", 5901, 521, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 512, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 9, "", "", "", "", "", ""], "isController": false}, {"data": ["03 Búsqueda", 5798, 197, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 178, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 19, "", "", "", "", "", ""], "isController": false}, {"data": ["01 Home", 6056, 1228, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1228, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["04 Detalle de producto", 5649, 63, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 60, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 3, "", "", "", "", "", ""], "isController": false}, {"data": ["06 Ver carrito", 5472, 10, "Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 9, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["05 Agregar al carrito (AJAX)", 5546, 11, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 11, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
