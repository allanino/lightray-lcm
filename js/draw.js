window.draw = function(){}

window.onload = function() {

    var canvas = new Raphael(document.getElementById('canvas_container'), "100%", "100%");

    window.draw = function(){

        canvas.clear();

        var na = parseInt($("#a").val());
        var nb = parseInt($("#b").val());

        var a = Math.min(na,nb);
        var b = Math.max(na,nb);

        var x = 0,
            y = 0;
        var size = Math.min(canvas.canvas.offsetHeight, canvas.canvas.offsetWidth);
        var  width = size/b,
             height = size/b;

        console.log('Draw grid.');
        var rects = drawGrid(x, y,  width, height, a, b);

        console.log('Compute path.');
        var res = computePath(x, y,  width, height, a, b, rects);

        console.log('Animate.');
        var sequence_path = res[0];
        var highlight = res[1];
        drawPath(a, b, rects, sequence_path, highlight, highlight.length*150,
                   { stroke: 'black', 'stroke-width': 2, 'stroke-opacity': 1, fill: 'none', 'fill-opacity': 0 },
                   function()
                   {
                       //alert("All done");    // trigger whatever you want here
                   } );
    }

    function drawGrid(x, y, width, height, a, b)
    {
        var rect_list = [];
        for (i=0; i < a; i++)
        {
            x_temp = x;
            for (j=0; j < b; j++)
            {
                var rect = canvas.rect(x_temp,y,width,height).attr({"fill":"white","stroke":"gray"});
                rect_list.push(rect);
                x_temp = x_temp + width;
            }
            y = y + width;
        }

        return rect_list;
    }

    function drawPath(a, b, rects, pathstr, highlight, duration, attr, callback )
    {
        var guide_path = canvas.path( pathstr ).attr( { stroke: "none", fill: "none" } );
        var path = canvas.path( guide_path.getSubpath( 0, 1 ) ).attr( attr );
        var total_length = guide_path.getTotalLength( guide_path );
        var last_point = guide_path.getPointAtLength( 0 );

        var interval_length = 50;
        var result = path;
        //var number = canvas.text(10, 10, 1);
        $("#count").text(1);
        var start_time = new Date().getTime();
        var old_index = 0;
        highlight[old_index].attr({fill:'lightgray'});
        var interval_id = setInterval( function()
        {
            var elapsed_time = new Date().getTime() - start_time;
            var this_length = elapsed_time / duration * total_length;
            var subpathstr = guide_path.getSubpath( 0, this_length );
            attr.path = subpathstr;

            path.animate( attr, interval_length );

            var index = Math.floor(highlight.length*elapsed_time/duration);

            // To avoid skipping something, just catch up the rectangles
            if(index > old_index && index >= 0 && index < highlight.length){
                for(var i = old_index; i <= index; i++){
                    highlight[i].attr({fill:'lightgray'});
                }
                $("#count").text(index+1);
                old_index = index;
            }

            if ( elapsed_time >= duration )
            {
                clearInterval( interval_id );
                if ( callback != undefined ) callback();
                    guide_path.remove();
            }
        }, interval_length );
        return result;
    }

    function computePath(x, y, width, height, a, b, rects)
    {
        // Fix BBox  if a = 10, b = 15, for instance
        for(var k = 0; k < a*b; k++) {
            rects[k].getBBox();
        }

        var i = 0;
            j = 0;
        var reverse_x = false,
            reverse_y = false;
        var highlight = [];
        var count = 1;
        var x, y, old_x, old_y;
        var sequence_path = ["M" + x + "," + y];
        while(true){
            old_x = x + i*width;
            old_y = y + j*height;

            if(reverse_x){
                i -= 1;
            } else {
                i += 1;
            }

            if(reverse_y){
                j -= 1;
            } else {
                j += 1;
            }

            new_x = x + i*width;
            new_y = y + j*height;

            var mean_x = (old_x + new_x)/2;
            var mean_y = (old_y + new_y)/2;

            // Found a bug:
            // rects[7].isPointInside(261.875 , 261.875) => false
            // rects[7].isPointInside(261.874 , 261.874) => true
            // rects[7].isPointInside(261.876 , 261.876) => true
            // x = y = 30; a = 4 b = 6; console.log(rects[7].isPointInside(261.875 , 261.875))

            for(var k = 0; k < a*b; k++) {
                if(rects[k].isPointInside(Math.round(mean_x), Math.round(mean_y))){
                    highlight.push(rects[k]);
                }
            }

            sequence_path.push("L" + new_x + "," + new_y);

            if(i >= b || i <= 0){
                reverse_x = !reverse_x;
            };
            if(j >= a || j <= 0){
                reverse_y = !reverse_y
            };
            if( (i ==  b && j == 0) || (i == b && j == a) || (i == 0 && j == a)){
                console.log("result: " + count)
                break;
            }

            count  += 1;
            if(count > a*b){
                break;
            }
        }

        return [sequence_path, highlight];

    }

    window.draw();
}
