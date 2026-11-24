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

    var data = {"OkPercent": 64.0977234869517, "KoPercent": 35.90227651304831};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.015408106607440311, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.019610919359899594, 500, 1500, "02 Categoría Clothes"], "isController": false}, {"data": [0.015275952693823916, 500, 1500, "03 Búsqueda"], "isController": false}, {"data": [0.002976190476190476, 500, 1500, "01 Home"], "isController": false}, {"data": [0.020151567344126764, 500, 1500, "04 Detalle de producto"], "isController": false}, {"data": [0.024011821204285185, 500, 1500, "06 Ver carrito"], "isController": false}, {"data": [0.01245995016019936, 500, 1500, "05 Agregar al carrito (AJAX)"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 18010, 6466, 35.90227651304831, 12960.23459189349, 18, 30030, 5385.5, 30001.0, 30002.0, 30002.0, 57.82703903726489, 2600.598379464257, 33.15764661048785], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["02 Categoría Clothes", 3187, 1283, 40.25729526200188, 12393.155632256063, 27, 30017, 4755.0, 30002.0, 30002.0, 30002.0, 10.23991671834285, 530.909350119123, 4.247270132023275], "isController": false}, {"data": ["03 Búsqueda", 3044, 1136, 37.319316688567675, 11122.537779237835, 24, 30005, 4508.5, 30001.0, 30002.0, 30002.0, 9.790142317279086, 380.2975622135563, 5.943191183565168], "isController": false}, {"data": ["01 Home", 3360, 1519, 45.208333333333336, 23696.492857142825, 22, 30030, 26156.5, 30002.0, 30002.0, 30002.0, 10.792510768420343, 580.9924476264105, 0.9817162200034047], "isController": false}, {"data": ["04 Detalle de producto", 2903, 969, 33.37926283155357, 10514.199793317232, 25, 30020, 3356.0, 30001.0, 30002.0, 30002.0, 9.341584046904213, 622.2468134424445, 6.366911841012868], "isController": false}, {"data": ["06 Ver carrito", 2707, 772, 28.51865533801256, 8328.879571481342, 23, 30003, 3092.0, 29071.800000000003, 30001.0, 30002.0, 8.724434217056963, 420.6423635870493, 7.184163526337671], "isController": false}, {"data": ["05 Agregar al carrito (AJAX)", 2809, 787, 28.017087931648273, 9743.901032395885, 18, 30004, 3497.0, 30001.0, 30002.0, 30002.0, 9.050138216778034, 69.9160536703562, 8.517660546117366], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 227, 3.5106712032168264, 1.260410882842865], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 2915, 45.08196721311475, 16.185452526374238], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 3324, 51.40736158366842, 18.456413103831206], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 18010, 6466, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 3324, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 2915, "Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 227, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["02 Categoría Clothes", 3187, 1283, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 645, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 638, "", "", "", "", "", ""], "isController": false}, {"data": ["03 Búsqueda", 3044, 1136, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 636, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 500, "", "", "", "", "", ""], "isController": false}, {"data": ["01 Home", 3360, 1519, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1052, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 467, "", "", "", "", "", ""], "isController": false}, {"data": ["04 Detalle de producto", 2903, 969, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 487, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 482, "", "", "", "", "", ""], "isController": false}, {"data": ["06 Ver carrito", 2707, 772, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 308, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 237, "Test failed: text expected to contain /cart-products-count&quot;&gt;(1)/", 227, "", "", "", ""], "isController": false}, {"data": ["05 Agregar al carrito (AJAX)", 2809, 787, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 403, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 384, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
