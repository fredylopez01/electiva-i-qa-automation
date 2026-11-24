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

    var data = {"OkPercent": 66.4721456746096, "KoPercent": 33.52785432539039};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.015345544928945805, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.020723785957315187, 500, 1500, "02 Categoría Clothes"], "isController": false}, {"data": [0.017417705337168424, 500, 1500, "03 Búsqueda"], "isController": false}, {"data": [0.0021626297577854673, 500, 1500, "01 Home"], "isController": false}, {"data": [0.020337301587301588, 500, 1500, "04 Detalle de producto"], "isController": false}, {"data": [0.019168173598553346, 500, 1500, "06 Ver carrito"], "isController": false}, {"data": [0.01402354570637119, 500, 1500, "05 Agregar al carrito (AJAX)"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 18507, 6205, 33.52785432539039, 12600.815961528036, 20, 30053, 4325.0, 30001.0, 30002.0, 30002.0, 59.49426499331344, 2748.3631106956345, 35.21296541676846], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["02 Categoría Clothes", 3233, 1257, 38.88029693782864, 12487.12186823385, 28, 30027, 4248.0, 30001.0, 30002.0, 30002.0, 10.402957747838483, 551.2550812660686, 4.333681687351381], "isController": false}, {"data": ["03 Búsqueda", 3129, 1117, 35.69830616810483, 10480.097155640791, 25, 30007, 4168.0, 30001.0, 30002.0, 30002.0, 10.076126439446634, 400.85719794262985, 6.293965690572108], "isController": false}, {"data": ["01 Home", 3468, 1541, 44.43483275663206, 23904.788927335587, 27, 30014, 26442.5, 30002.0, 30002.0, 30002.0, 11.148723586879997, 608.2342156944886, 1.0284347403453276], "isController": false}, {"data": ["04 Detalle de producto", 3024, 922, 30.48941798941799, 9829.468584656099, 24, 30053, 3277.5, 30001.0, 30002.0, 30002.0, 9.74308415008989, 675.6561552050912, 6.919688524973097], "isController": false}, {"data": ["06 Ver carrito", 2765, 679, 24.556962025316455, 7476.108137432181, 21, 30011, 2978.0, 27131.800000000003, 30001.0, 30002.0, 8.923240766140093, 442.51679852012165, 7.602939233617866], "isController": false}, {"data": ["05 Agregar al carrito (AJAX)", 2888, 689, 23.857340720221607, 9259.921052631575, 20, 30003, 3355.0, 30001.0, 30002.0, 30002.0, 9.310152514998437, 74.50911929720921, 9.119848140830562], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 178, 2.868654311039484, 0.9617982385043498], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 2868, 46.22078968573731, 15.496839033879073], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 3159, 50.910556003223206, 17.06921705300697], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 18507, 6205, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 3159, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 2868, "Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 178, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["02 Categoría Clothes", 3233, 1257, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 649, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 608, "", "", "", "", "", ""], "isController": false}, {"data": ["03 Búsqueda", 3129, 1117, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 674, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 443, "", "", "", "", "", ""], "isController": false}, {"data": ["01 Home", 3468, 1541, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1110, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 431, "", "", "", "", "", ""], "isController": false}, {"data": ["04 Detalle de producto", 3024, 922, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 509, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 413, "", "", "", "", "", ""], "isController": false}, {"data": ["06 Ver carrito", 2765, 679, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 288, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 213, "Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 178, "", "", "", ""], "isController": false}, {"data": ["05 Agregar al carrito (AJAX)", 2888, 689, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 358, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 331, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
