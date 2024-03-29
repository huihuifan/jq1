//Angela Fan

var   width = 1060,
      height = 800,
      dr = .01,
      off = 15,
      expand = {};

var data, net, force, hullg, hull, linkg, link, nodeg, node;

var curve = d3.svg.line()
              .interpolate("cardinal-closed")
              .tension(.85);

var fill = d3.scale.category20()
            //.range(["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"]);  

var drag = d3.behavior.drag()
  .origin(Object)
  .on("drag", function(){ dragmove(this); });

function dragmove(dragged) {
  var x = d3.select(dragged).attr("cx");
  var y = d3.select(dragged).attr("cy");
  var r = d3.select(dragged).attr("r")
  d3.select(dragged)
    .attr("cx", Math.max(r, Math.min(width - r,
    +x + d3.event.dx)))
    .attr("cy", Math.max(r, Math.min(height - r,
    +y + d3.event.dy)));
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function noop() { return false; }
 
function nodeid(n) {
  return n.size ? "_g_"+n.group : n.name;
}
 
function linkid(l) {
  var u = nodeid(l.source),
      v = nodeid(l.target);
  return u<v ? u+"|"+v : v+"|"+u;
}
 
function getGroup(n) { return n.group; }
 
// constructs the network to visualize
function network(data, prev, index, expand) {
  expand = expand || {};
  var gm = {},    // group map
      nm = {},    // node map
      lm = {},    // link map
      gn = {},    // previous group nodes
      gc = {},    // previous group centroids
      nodes = nodes || [], // output nodes- should take care of appending to the existing node
      links = []; // output links
 
  // process previous nodes for reuse or centroid calculation
  if (prev) {
    prev.nodes.forEach(function(n) {
      var i = index(n), o;
      if (n.size > 0) {
        gn[i] = n;
        n.size = 0;
      } else {
        o = gc[i] || (gc[i] = { x:0, y:0, count:0 });
        o.x += n.x;
        o.y += n.y;
        o.count += 1;
      }
    });
  }
 
  // determine nodes
  for (var k=0; k<data.nodes.length; ++k) {
    var n = data.nodes[k],
        i = index(n),
        l = gm[i] || (gm[i]=gn[i]) || (gm[i]={group:i, size:0, nodes:[]});
 
    if (expand[i]) {
      // the node should be directly visible
      nm[n.name] = nodes.length;
      nodes.push(n);
      if (gn[i]) {
        // place new nodes at cluster location (plus jitter)
        n.x = gn[i].x + Math.random();
        n.y = gn[i].y + Math.random();
      }
    } else {
      // the node is part of a collapsed cluster
      if (l.size == 0) {
        // if new cluster, add to set and position at centroid of leaf nodes
        nm[i] = nodes.length;
        nodes.push(l);
        if (gc[i]) {
          l.x = gc[i].x / gc[i].count;
          l.y = gc[i].y / gc[i].count;
        }
      }
      l.nodes.push(n);
    }
  // always count group size as we also use it to tweak the force graph strengths/distances
    l.size += 1;
  n.group_data = l;
  }
 
  for (i in gm) { gm[i].link_count = 0; }
 
  // determine links
  for (k=0; k<data.links.length; ++k) {
    var e = data.links[k],
        u = index(e.source),
        v = index(e.target);
  if (u != v) {
    gm[u].link_count++;
    gm[v].link_count++;
  }

    //console.log(expand)

    u = expand[u] ? nm[e.source.name] : nm[u];
    v = expand[v] ? nm[e.target.name] : nm[v];
    var i = (u<v ? u+"|"+v : v+"|"+u),
        l = lm[i] || (lm[i] = {source:u, target:v, size:0});
    l.size += 1;
  }
  for (i in lm) { links.push(lm[i]); }
 
  return {nodes: nodes, links: links};
}
 
function convexHulls(nodes, index, offset) {
  var hulls = {};

  //console.log(expand)
 
  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;
    var i = index(n),
        l = hulls[i] || (hulls[i] = []);
    l.push([n.x-offset, n.y-offset]);
    l.push([n.x-offset, n.y+offset]);
    l.push([n.x+offset, n.y-offset]);
    l.push([n.x+offset, n.y+offset]);
  }
 
  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    hullset.push({group: i, path: d3.geom.hull(hulls[i])});
  }
 

  //console.log(expand)
  return hullset;
}
 
function drawCluster(d) {
  return curve(d.path); // 0.8
}
 
 
var body = d3.select("body");
 
var vis = body.append("svg")
    .attr("class", "svg")
    .attr("width", width)
    .attr("height", height);

vis.append("svg:rect")
  .attr("class", "border_box")
  .attr("width", width)
  .attr("height", height)
  .style("stroke", "black")
  .style("stroke-width", "1px")
  .style("fill", "white");

//var current_selection = document.getElementById("range").innerHTML;

//console.log(current_selection)

//var current_file = "outfile_" + current_selection + ".json";

//console.log(current_file)

//console.log($(".slider").on("change", function(){console.log(this.value)}));

//transition("outfile_2013.json");

$(document).ready(
  transition("outfile_1_2013.json")
);

$(".slider").on("change", function(){
  transition();
});

function transition(arg) {

  //console.log("happening")

  if (arg == null) {
    var current_selection = document.getElementById("range").innerHTML;
    var current_file = "outfile_1_" + current_selection + ".json";

    var current_names = current_selection + "_names.csv"
    //console.log(current_file)
  }
  else {
    var current_file = arg
  }

  //var current_selection = document.getElementById("range").innerHTML;

  //console.log(current_selection)

  //var current_file = "outfile_" + current_selection + ".json";

  d3.selectAll(".hull").remove();
  d3.selectAll(".node").remove();
  d3.selectAll(".inner link").remove();
  d3.selectAll("g").remove();

  var current_year = current_file.split("_")[2].split(".")[0];

  var degree_file = current_year + "_degree.csv";

  //console.log(degree_file)

  d3.csv(degree_file, function(error, name_data) {
    name_data.forEach(function(d) {
      d.id = d.Id;
      d.name = d.name;
      d.degree = +d.Degree;
    })

    var name_data_length = name_data.length;
    
    d3.json(current_file, function(json) {
        data = json;
        for (var i=0; i<data.links.length; ++i) {
          o = data.links[i];
          o.source = data.nodes[o.source];
          o.target = data.nodes[o.target];
        }

        // name_data = d3.csv("2011_degree.csv")
        //   .row(function(d) {
        //     return {id: d.Id, name: d.name, degree: +d.Degree}
        //   })
        //   // .get(function(error, rows) {
        //   //   // name_data = rows
        //   //   // console.log(name_data)
        //   // })

        // console.log(name_data)

        //console.log(rows)

        //console.log(data)
       
        nodeg = vis.append("g");
        hullg = vis.append("g");
        linkg = vis.append("g");
       
        init();
       
        vis.attr("opacity", 1e-6)
          .transition()
            .duration(1000)
            .attr("opacity", .85);
      });


  var graph_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([0,0]);

  vis.call(graph_tip);
   
  function init() {
    if (force) force.stop();
   
    net = network(data, net, getGroup, expand);
   
    force = d3.layout.force()
        .nodes(net.nodes)
        .links(net.links)
        .size([width, height])
        .linkDistance(function(l, i) {
        var n1 = l.source, n2 = l.target;
      // larger distance for bigger groups:
      // both between single nodes and _other_ groups (where size of own node group still counts),
      // and between two group nodes.
      //
      // reduce distance for groups with very few outer links,
      // again both in expanded and grouped form, i.e. between individual nodes of a group and
      // nodes of another group or other group node or between two group nodes.
      //
      // The latter was done to keep the single-link groups ('blue', rose, ...) close.
      return 30 +
        Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
                               (n2.size || (n1.group != n2.group ? n2.group_data.size : 0))),
             -30 +
             30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
                           (n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
             100);
        //return 150;
      })
      .linkStrength(function(l, i) {
      return 1;
      })
      .gravity(1.5)   // gravity+charge tweaked to ensure good 'grouped' view (e.g. green group not smack between blue&orange, ...
      .charge(-1600)    // ... charge is important to turn single-linked groups to the outside
      .friction(0.5)   // friction adjusted to get dampened display: less bouncy bouncy ball [Swedish Chef, anyone?]
        .start();
   
    hullg.selectAll("path.hull").remove();
    
    hull = hullg.selectAll("path.hull")
          .data(convexHulls(net.nodes, getGroup, off))
        .enter().append("path")
          .attr("class", "hull")
          .attr("d", drawCluster)
          .style("fill", function(d) { return fill(d.group); })
          .on("mouseover", function(d) {
           
            d3.select(this)
              .style("stroke", "#00FF7F")
              .style("stroke-width", "6px");

            graph_tip.html("<strong>Lab: </strong>" + d.group);
            graph_tip.show(d);
          })
          .on("mouseout", function(d) {

            d3.select(this)
              .style("stroke", null)
              .style("stroke-width", null);

            graph_tip.hide(d);

          })
          .on("click", function(d) {

            //console.log("hull click", d, arguments, this, expand[d.group]);
            expand[d.group] = false; init();
        });
   

   //console.log(net.nodes)
   
    node = nodeg.selectAll("circle.node").data(net.nodes, nodeid);
    node.exit().remove();

    //console.log(net.nodes)

    
    node.enter().append("circle")
          .attr("class", function(d) { return "node" + (d.size?"":" leaf"); })
          .attr("r", function(d) { return d.size ? d.size + dr : dr + 1; })
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .style("fill", function(d) { return fill(d.group); })
          .on("mouseover", function(d) {

            d3.select(this)
              .style("stroke-width", "6px")
              .style("stroke", "#00FF7F");


            if (net.nodes[1].nodes.length) {
               var net_nodes_length = net.nodes.length;

                  for (var i = 0; i < net_nodes_length; i++) {

                    var nodes_length = net.nodes[i].nodes.length;

                    for (var j = 0; j < nodes_length; j++) {
                      var current_person = net.nodes[i].nodes[j].id;
                      var names_length = name_data.length;

                      for (var k = 0; k < names_length; k++) {

                        if (name_data[k].id == current_person) {
                          // if (k == 1) {
                          //   console.log(name_data[k].degree)
                          // }
                          //console.log("found")
                          net.nodes[i].nodes[j].degree = name_data[k].degree

                          // if (k == 1) {
                          //   console.log(net.nodes[i].nodes[j].degree)
                          // }
                        }
                      }
                    }
                  }

                  //console.log(d)

                  var top_vals = [];
                  for (var i = 0; i < d.nodes.length; i++) {
                    if (d.nodes[i].degree) {
                      top_vals.push({name: d.nodes[i].name, degree: d.nodes[i].degree});
                    }
                  }

                  top_vals.sort(function(a, b) { return b.degree - a.degree })

                  top_vals = top_vals.slice(0,3);

                  if (top_vals.length != 0) {
                    var tip_string = "";
                    for (var i = 0; i < top_vals.length; i++) {
                      string = "<br>" + top_vals[i].name + ", Degree: " + top_vals[i].degree;
                      tip_string = tip_string.concat(string)
                    }

                    graph_tip.html("<strong>Top interactors: </strong>" + tip_string);
                    graph_tip.show(d);
                  }

            }
           
          })
          .on("mouseout", function(d) {
            d3.select(this)
              .style("stroke-width", null)
              .style("stroke", null)
            graph_tip.hide(d)
          })
          .on("click", function(d) {

            //console.log(expand)

            //console.log("node click", d, arguments, this, expand[d.group]);
            expand[d.group] = !expand[d.group];

        init();
          });
   

      link = nodeg.selectAll("line.link").data(net.links, linkid);
      link.exit().remove();
      link.enter().append("line")
          .attr("class", function(d) {
            if (d.size == 1) {
              return "inner"
            }
          })
          .classed("link", true)
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .style("stroke-width", function(d) {
            //console.log(d.size)
            return d.size || .1;
          });
    

    d3.selectAll(".node").moveToFront();
    d3.selectAll(".hull").moveToFront();
    d3.selectAll(".inner").moveToFront();

    node.call(force.drag);
    node.call(drag);
   
    node.transition()
      .duration(750)
      .delay(function(d,i) { return i*5; })
      .attrTween("size", function(d) {
        var i = d3.interpolate(0, d.size);
        return function(t) { return d.size = i(t); };
      })



    force.on("tick", function() {
      if (!hull.empty()) {
        hull.data(convexHulls(net.nodes, getGroup, off))
            .attr("d", drawCluster);
      }
   
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
   
      node
          .each(collide(.5))
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });
    }
  })
}


function collide(alpha) {
  var quadtree = d3.geom.quadtree(net.nodes);
  return function(d) {
    var r = d.size + 50,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.size + quad.point.size;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}
