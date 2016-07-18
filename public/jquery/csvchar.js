$(function() {
    vpw = $(window).width();
    vph = $(window).height();
    $("#right, #left").css({"height": vph + "px"});

    var new_height1 = $(".files_list_header").height() + $("#fileHolder").height();
    $("#fileOutput").height($(window).height() - (new_height1 + 20));

    $(window).resize(function() {
        $("#right, #left").height($(window).height());
        var new_height2 = $(".files_list_header").height() + $("#fileHolder").height();
        $("#fileOutput").height($(window).height() - (new_height2 + 20));
    });

    // document.getElementById('files').addEventListener('change', handleFileSelect, false);

    $('#files').live('change', function (e) {
        handleFileSelect(e);
    });

    $('#print_report').live('click', function () {
        var html_name = $("#title").html();
        var person = html_name.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? 'amp'])+/g, '-').replace(/^(-)+|(-)+$/g,'');
        var hide_these = $('#status, #right');
        // We need to hide uneeded items when we print
        hide_these.css("display", "none");
        html2canvas(document.body, {
            onrendered: function (canvas) {
                var img = canvas.toDataURL("image/png");
                var doc = new jsPDF();
                doc.addImage(img, 'JPEG', 20, 20);
                doc.save(person + '.pdf');

            }
        });
        hide_these.css("display", "block");
        return false;
    });
    
    $('button.reset_files').click(function () {
        $('#fileOutput, tbody#results_table, #chartContainer, #status').empty();
        $('#giving_result').hide();
        $("input[type=file]").val("");
        $('#fileOutput').html('<div class="instruction">Click on Choose Files button above to select ' +
            'a folder that contains your CSV files.</div>');
    })
});

function handleFileSelect(evt) {
    if (window.FileReader) {
        var files = evt.target.files; // FileList object
        var extension;
        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            extension = files[i].name.split(".").pop();
            if(extension == 'csv') {
                output.push('<li class="type-'+ extension+'" id="file_list-' + i + '" ' +
                    'onclick="getAsText(' + i + ');"><strong>', f.name, '</strong></li>');
            }
        }
        document.getElementById('fileOutput').innerHTML = output.join('');
    } else {
        alert('FileReader are not supported in this browser.');
    }
}

function getAsText(num) {
    console.log(num);
    var file = document.getElementById("files").files[num];

    var reader = new FileReader();
    // Read file into memory as UTF-8
    reader.readAsText(file);
    // Handle errors load
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
}

function loadHandler(event) {
    var csv = event.target.result;
    var data = processData(csv);
    drawChartHTML(data);
}

function processData(csv) {
    var allTextLines = csv.split(/\r\n|\n/);
    var months_data = [];
    var total = null;
    var person = null;
    var year = null;

    var months = {
        '01': "January",
        '02': "February",
        '03': "March",
        '04': "April",
        '05': "May",
        '06': "June",
        '07': "July",
        '08': "August",
        '09': "September",
        '10': "October",
        '11': "November",
        '12': "December"
    };

    for(var item in months) {
        months_data.push({id: parseInt(item), label: months[item], y: 0});
    }

    for (var i=0; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(';');
        for (var j=0; j<data.length; j++) {
            var split_line = data[j].split(',');
            if (split_line[3] != null || split_line[3] != '') {
                var month_number = split_line[3].split("/")[0];
                var month_name = '';

                if((person == null || person == '') && Date.parse(split_line[3])) {
                    person = split_line[4];
                }
                if((year == null || year == '') && Date.parse(split_line[3])) {
                    var d = new Date(split_line[3]);
                    year = d.getFullYear();
                }
                for(var key in months) {
                    if(parseInt(month_number) == parseInt(key)) {
                        month_name = months[key];
                        for(var items in months_data) {
                            if(month_name == months_data[items].label ) {
                                months_data[items].y += parseInt(split_line[7]);
                                total += parseInt(split_line[7]);
                            }
                        }
                    }
                }
            }
        }
    }
    console.log(months_data);

    months_data.sort(function(a,b) {return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0);} );

    return({person: person, year: year, chart_data: months_data, total: total});
}

function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        alert("Canno't read file !");
    }
}

function drawChartHTML(data){
    $("#status").empty().html('<button id="print_report">Print Report</button>');
    var year = data.year;
    var person = data.person;
    var values = data.chart_data;

    $('#giving_result').show();
    $("#title").empty().text(person + " Tithes and offerings for " + year);
    var html = '';
    for (var e in data.chart_data) {
        html += '<tr>'
            +'<td>'+person+'</td>'
            +'<td>'+data.chart_data[e].label+'</td>'
            +'<td> $'+data.chart_data[e].y+'</td>'
            +'</tr>';
    }
    if(data.total != null) {
        html += '<tr><td>Total</td><td></td><td>$'+data.total+'</td>';
    }
    $('#results_table').html(html);

    var chart = new CanvasJS.Chart("chartContainer", {

        title:{
            text: "Overview"
        },
        data: [//array of dataSeries
            { //dataSeries object
                /*** Change type "column" to "bar", "area", "line" or "pie"***/
                type: "column",
                dataPoints: values
            }
        ]
    });

    chart.render();
}
