var mt = {};
$(function() {
    "use strict";
    $(window).load(function() {
        mt.app = new mt.AppView
    })
}), $(function() {
    "use strict";
    mt.AppView = Backbone.View.extend({
        el: $(document),
        graphs: undefined,
        $rangeVal: $("#graph-range-val"),
        rangeTracker: undefined,
        rangeValTracker: undefined,
        events: {
            "click #new-graph": "newGraph",
            "slide #graph-range": "slide",
            "slidestop #graph-range": "slideStop"
        },
        initialize: function() {
            this.graphs = new mt.GraphsView({
                collection: new mt.Graphs,
                el: $("#graphs")
            }), this.graphs.fetch(), $("#graphs").sortable({
                delay: 300,
                placeholder: "graph-placeholder",
                forcePlaceholderSize: !0,
                containment: "parent",
                axis: "y"
            }), $("#graph-range").slider({
                value: mt.settings.graphRanges.indexOf(mt.settings.graphRange),
                min: 0,
                max: mt.settings.graphRanges.length - 1,
                step: 1
            }), this.$rangeVal.html(this._prettyRange(mt.settings.graphRange))
        },
        newGraph: function() {
            return this.graphs.new(), !1
        },
        slide: function(e, t) {
            var n = +mt.settings.graphRanges[t.value];
            this.$rangeVal.html(this._prettyRange(n)).addClass("active")
        },
        slideStop: function(e, t) {
            var n = this,
                r = +mt.settings.graphRanges[t.value];
            $(".graph-overlay").addClass("active"), mt.stats.load(mt.stats.data[mt.stats.end].time - r, mt.stats.data[0].time, this._refreshedGraphs), mt.stats.save("graphRange", r), this.rangeValTracker && clearTimeout(this.rangeValTracker), this.rangeValTracker = setTimeout(function() {
                n.$rangeVal.removeClass("active")
            }, 2e3)
        },
        _prettyRange: function(e) {
            var t = new Date(e),
                n = Math.floor(e / 864e5);
            return n !== 0 ? n + "d" : "00".slice(t.getUTCHours().toString().length) + t.getUTCHours() + ":" + "00".slice(t.getUTCMinutes().toString().length) + t.getUTCMinutes()
        },
        _refreshedGraphs: function() {
            $(".graph-overlay").removeClass("active")
        }
    })
}), $(function() {
    "use strict";
    mt.Graph = Backbone.Model.extend({
        defaults: function() {
            return {
                width: 940,
                height: 150,
                title: undefined,
                property: undefined,
                ticks: 4,
                colour: "#0072c6",
                log: !1,
                minZero: !1,
                logZero: 1e-5,
                order: 0
            }
        },
        initialize: function() {
            this.has("colourRgba") || this.set({
                colourRgba: this.get("colour").replace(/#(\w{2})(\w{2})(\w{2})/, function() {
                    return "rgba(" + Array.prototype.slice.call(arguments, 1, 4).map(function(e) {
                        return parseInt(e, 16)
                    }) + ",%)"
                })
            }, {
                silent: !0
            })
        },
        change: function(e) {
            e && e.changes && Object.keys(e.changes).length > (e.changes.id ? 1 : 0) && this.save()
        }
    }), mt.GraphView = Backbone.View.extend({
        tagName: "li",
        className: "graph-container",
        template: _.template($("#graph-template").html()),
        tension: .85,
        axisHeight: 20,
        graphPadding: 5,
        clippedPoints: 3,
        dotR: 5,
        transitionDuration: undefined,
        shortTransition: 500,
        graphHeight: undefined,
        extraWidth: 0,
        yDomain: undefined,
        logZero: undefined,
        dataStart: 0,
        dataEnd: 0,
        infoTracker: undefined,
        svg: undefined,
        g: undefined,
        slider: undefined,
        line: undefined,
        lineEl: undefined,
        area: undefined,
        areaEl: undefined,
        x: undefined,
        y: undefined,
        dot: undefined,
        xAxis: undefined,
        yAxis: undefined,
        yMin: undefined,
        yMax: undefined,
        events: {
            "click .graph-metric": "metric",
            "click .graph-log": "log",
            "click .graph-min-zero": "minZero",
            "click .graph-delete": "delete",
            "mouseenter .graph-frame": "dotEnter",
            "mouseleave .graph-frame": "dotLeave",
            "click .graph-metric-toggle": "metricToggle"
        },
        initialize: function(e) {
            var t;
            this.yDomain = [0, 0], this.logZero = this.model.get("logZero"), this.graphHeight = this.model.get("height") - this.axisHeight - this.graphPadding * 2, this.model.bind("destroy", this.remove, this), mt.stats.register(this.tick, this), this.transitionDuration = mt.settings.interval, this.model.get("property") === undefined && (t = $(this.template()).find("li:first a").eq(0), this.model.set("property", t.data("key")), this.model.set("title", t.html()))
        },
        metric: function(e) {
            var t = $(e.target),
                n = t.html();
            return this.model.set("title", n), this.$el.find(".graph-title").html(n), this.model.set("property", t.data("key")), t.parents(".btn-group, .graph-container").removeClass("open"), this.tick(), !1
        },
        metricToggle: function(e) {
            var t = $(e.target);
            setTimeout(function() {
                t.parent().hasClass("open") ? t.parents(".graph-container").addClass("open") : t.parents(".graph-container").removeClass("open")
            })
        },
        log: function(e) {
            return this._radioButtons(e.target, "log", "minZero")
        },
        minZero: function(e) {
            return this._radioButtons(e.target, "minZero", "log")
        },
        _radioButtons: function(e, t, n) {
            var r = !this.model.get(t),
                i = this.model.get(n),
                s = n.replace(/[A-Z]/g, function(e) {
                    return "-" + e.toLowerCase()
                });
            return this.model.set(t, r), $(e).toggleClass("active"), r && i && (this.model.set(n, !1), this.$el.find(".graph-" + s).removeClass("active")), this._setYAxis(), this.tick(), !1
        },
        "delete": function() {
            return mt.stats.unregister(this.tick, this), this.model.destroy(), this.$el.remove(), !1
        },
        dotEnter: function() {
            $(".graph-frame").on("mousemove", null, this, this.dotMove), this.dot.style("display", "inline")
        },
        dotLeave: function() {
            $(".graph-frame").off("mousemove"), this.dot.style("display", "none"), this.infoTracker && clearTimeout(this.infoTracker), this.$infoEl.fadeOut(250).visible = !1
        },
        dotMove: function(e) {
            var t = e.data,
                n = e.pageX - t.$el.offset().left,
                r, i, s;
            r = Math.round((mt.stats.end - mt.stats.start) * n / t.model.get("width")) + mt.stats.start, t.graphX(mt.stats.data[r]) < n ? (i = Math.max(mt.stats.start, r - 1), s = mt.stats.end) : (i = mt.stats.start, s = Math.min(r + 1, mt.stats.end));
            while (i < s - 1) r = Math.round((i + s) / 2), t.graphX(mt.stats.data[r]) < n ? i = r : s = r;
            r = n - t.graphX(mt.stats.data[i]) < t.graphX(mt.stats.data[s]) - n ? i : s, t.dot.attr("cx", t.graphX(mt.stats.data[r])).attr("cy", t.graphY(mt.stats.data[r])), t.infoTracker && clearTimeout(t.infoTracker), t.infoTracker = setTimeout(function() {
                t.showInfo(mt.stats.data[r])
            }, 500)
        },
        showInfo: function(e) {
            var t, n, r = Math.round(this.dot.attr("cx")),
                i = Math.round(this.dot.attr("cy")),
                s = new Date(e.time);
            this.$infoEl.children(".property").html(e[this.model.get("property")] + " " + this.model.get("title")).end().children(".time").html(["getHours", "getMinutes", "getSeconds"].map(function(e) {
                return "00".slice(s[e]().toString().length) + s[e]()
            }).join(":") + " " + s.getDate() + "/" + s.getMonth() + "/" + s.getFullYear()), t = r < this.$infoEl.width() / 2 ? 5 : r > this.model.get("width") - this.$infoEl.width() / 2 ? r - this.$infoEl.width() - 5 : r - this.$infoEl.width() / 2, n = i < this.model.get("height") / 2 ? i + 15 : i - this.$infoEl.height() - 15, this.$infoEl.visible ? this.$infoEl.animate({
                left: t,
                top: n
            }, 100) : this.$infoEl.css({
                left: t,
                top: n
            }).fadeIn(250), this.$infoEl.visible = !0
        },
        render: function() {
            return this.$el.html(this.template()), this.$el.find(".graph-title").html(this.model.get("title")), this.model.get("log") && this.$el.find(".graph-log").addClass("active"), this.model.get("minZero") && this.$el.find(".graph-min-zero").addClass("active"), this.$infoEl = this.$el.find(".graph-info"), this.$infoEl.visible = !1, mt.stats.data.length && this.tick(), this
        },
        _renderGraph: function() {
            var e = this,
                t = this.model.get("width"),
                n = this.model.get("colour"),
                r = function(t) {
                    return e.model.get("colourRgba").replace("%", .3)
                },
                i = function(t) {
                    return e.graphX(t)
                },
                s = function(t) {
                    return e.graphY(t)
                };
            this.dataStart = mt.stats.start, this.dataEnd = mt.stats.end, this.x = d3.time.scale().range([0, t + this.extraWidth]), this.x.axis = d3.svg.axis().scale(this.x).tickFormat(d3.time.format("%H:%M")).orient("bottom"), this._setYAxis(), this.svg = d3.select(this.el).select(".graph-frame").append("svg:svg").attr("class", "graph"), this.g = this.svg.selectAll("g").data([mt.stats.data]).enter().append("svg:g").attr("transform", "translate(0, " + this.graphPadding + ")").attr("clip-path", "url(#clip)"), this.slider = this.g.append("svg:g"), this.line = d3.svg.line().interpolate("cardinal").tension(this.tension).x(i).y(s), this.area = d3.svg.area().interpolate("cardinal").tension(this.tension).x(i).y0(this.graphHeight).y1(s), this.areaStart = d3.svg.area().interpolate("cardinal").tension(this.tension).x(i).y0(s).y1(s), this.areaEl = this.slider.append("svg:path").attr("class", "area").style("fill", r), this.lineEl = this.slider.append("svg:path").attr("class", "line").style("stroke", n).attr("d", function(t) {
                return e.line(t)
            }), this.dot = this.slider.append("svg:circle").attr("r", this.dotR).attr("class", "dot").style("stroke", "#fff").style("fill", n), this.yAxis = this.g.append("g").attr("class", "y axis").attr("transform", "translate(0," + this.graphPadding + ")").call(this.y.axis), this.xAxis = this.g.append("g").attr("class", "x axis").attr("transform", "translate(0," + (this.graphHeight + this.graphPadding) + ")").call(this.x.axis), this.yMin = this.g.append("text").attr("class", "graph-val").attr("x", t).attr("y", this.graphHeight + this.graphPadding - 2), this.yMax = this.g.append("text").attr("class", "graph-val").attr("x", t).attr("y", 10), this.svg.append("defs").append("clipPath").attr("id", "clip").append("rect").attr("width", t).attr("height", this.model.get("height"))
        },
        tick: function() {
            var e = this,
                t = this.model.get("property"),
                n = this.svg === undefined,
                r = !1,
                i, s, o = d3.time.format(mt.stats.data[mt.stats.end].time - mt.stats.data[mt.stats.start].time < 3e5 ? "%X" : "%H:%M"),
                u = function(t) {
                    return e.graphX(t)
                },
                a = function(t) {
                    return e.graphY(t)
                };
            n && this._renderGraph(), this.x.domain([mt.stats.data[mt.stats.start].time, mt.stats.data[mt.stats.end].time]), i = this._getYDomain(), s = function(t) {
                t.duration(e.transitionDuration).ease("linear").attr("transform", "translate(" + e.x(mt.stats.data[mt.stats.start - 1].time) + "," + e.graphPadding + ")")
            }, n && (this._setExtraWidth(), this.svg.style("width", this.model.get("width") + this.extraWidth), this.x.range([0, this.model.get("width") + this.extraWidth]), this.x.axis.tickFormat(o), this.xAxis.call(this.x.axis), this.yAxis.call(this.y.axis));
            if (i[0] !== this.yDomain[0] || i[1] !== this.yDomain[1]) r = !0, this.yDomain = i, this.y.domain(this.yDomain), this.yMax.text(i[0].toPrecision(i[0] < 1 ? 3 : 4)), this.yMin.text(i[1].toPrecision(i[1] < 1 ? 3 : 4)), this.yAxis.transition().duration(this.shortTransition).ease("linear").call(this.y.axis);
            this.dataStart < mt.stats.start && this.dataStart++, this.dataEnd < mt.stats.end && this.dataEnd++, n ? this._fancyLine() : this.dataStart !== mt.stats.start || this.dataEnd !== mt.stats.end ? (this._setExtraWidth(), [this.g, this.lineEl, this.areaEl].forEach(function(e) {
                e.data([mt.stats.data])
            }), this._fancyLine(), this.dataStart = mt.stats.start, this.dataEnd = mt.stats.end, this.x.axis.tickFormat(o), this.xAxis.call(this.x.axis)) : r ? (this.areaEl.transition().duration(this.shortTransition).ease("linear").attr("d", this.area).attr("transform", null), this.lineEl.transition().duration(this.shortTransition).ease("linear").attr("d", this.line).attr("transform", null)) : (this.areaEl.attr("d", this.area).attr("transform", null), this.lineEl.attr("d", this.line).attr("transform", null)), this.slider.attr("transform", "translate(0," + e.graphPadding + ")").transition().call(s), this.xAxis.transition().duration(this.transitionDuration).ease("linear").call(this.x.axis)
        },
        _getYDomain: function() {
            var e = this,
                t = this.model.get("property"),
                n = this.model.get("log"),
                r = Math.max(mt.stats.end - 2, mt.stats.start - 1),
                i = function(i, s) {
                    return s < mt.stats.start - 1 || s > r ? undefined : Math.max(n ? e.logZero : -Infinity, i[t])
                },
                s = this.model.get("minZero") && !n ? 0 : d3.min(mt.stats.data, i);
            return [Math.max(d3.max(mt.stats.data, i), s + .1), s]
        },
        _setYAxis: function() {
            var e = this.model.get("log");
            e ? this.y = d3.scale.log().range([0, this.graphHeight]).clamp(!0) : this.y = d3.scale.linear().range([0, this.graphHeight]).clamp(!0), this.y.axis = d3.svg.axis().scale(this.y).orient("right"), this.y.axis.ticks(this.model.get("ticks")), this.yDomain = [0, 0]
        },
        _setExtraWidth: function() {
            this.extraWidth = Math.round(this.x(mt.stats.data[Math.min(mt.stats.start + this.clippedPoints, mt.stats.end)].time))
        },
        _fancyLine: function() {
            var e = this,
                t = mt.stats.start,
                n = Math.max(Math.round((mt.stats.end - mt.stats.start) / 15), 1);
            d3.timer(function() {
                if ((t += n) > mt.stats.end) return e.lineEl.attr("d", e.line).attr("transform", null), e.areaEl.attr("d", e.areaStart).attr("transform", null).transition().duration(e.shortTransition).ease("linear").style("opacity", 1).attr("d", e.area), !0;
                e.lineEl.attr("d", function(n) {
                    return e.line(mt.stats.data.slice(mt.stats.start, t))
                }).attr("transform", null)
            })
        },
        graphX: function(e) {
            return this.x(e.time)
        },
        graphY: function(e) {
            return this.y(Math.max(this.model.get("log") ? this.logZero : -Infinity, e[this.model.get("property")]))
        }
    })
}), $(function() {
    "use strict";
    mt.Graphs = Backbone.Collection.extend({
        model: mt.Graph,
        localStorage: new Store("mt-stats"),
        add: function(e, t) {
            return t && !t.parse && !Array.isArray(e) && e.save(undefined, {
                silent: !0
            }), Backbone.Collection.prototype.add.call(this, e, t)
        },
        comparator: function(e) {
            return e.get("order")
        },
        nextOrder: function() {
            return this.length ? this.last().get("order") + 1 : 0
        }
    }), mt.GraphsView = Backbone.View.extend({
        initialize: function() {
            var e = this;
            this.$el.on("sortstop", function() {
                e.sortstop()
            }), this.collection.on("add", this._add, this), this.collection.on("reset", this._reset, this)
        },
        "new": function() {
            return this.collection.create({
                order: this.collection.nextOrder(),
                silent: !0
            })
        },
        _add: function(e, t) {
            var n;
            this.$el.append(n = (new mt.GraphView({
                model: e
            })).render().el), n.id = e.get("id")
        },
        _reset: function() {
            this.collection.forEach(this._add, this)
        },
        fetch: function() {
            this.collection.fetch()
        },
        sortstop: function() {
            for (var e = 0, t = this.$el.children().length; e < t; e++) this.collection.get(this.el.childNodes[e].id).set("order", e)
        }
    })
}), $(function() {
    "use strict";

    function i() {
        if (!e) {
            setTimeout(i, mt.settings.retry);
            return
        }
        e = !1, s(), $.getJSON(mt.settings.url, function(t) {
            e = !0, mt.stats.start++, mt.stats.start >= mt.stats.end - 1 && console.log("start oops"), mt.stats.data.push(new r(t.stats))
        })
    }

    function s() {
        for (var e = 0, t = mt.stats.functions.length; e < t; e++) mt.stats.functions[e].f.apply(mt.stats.functions[e].t)
    }
    mt.stats = {}, mt.stats.start = 1, mt.stats.functions = [], mt.stats.data = [], Object.defineProperty(mt.stats, "end", {
        get: function() {
            return this.data.length - 1
        },
        enumerable: !0
    });
    var e = !0,
        t;
    mt.settings = JSON.parse($("#app-settings").html());
    if ((t = localStorage.getItem("mt-stats-settings")) !== null) {
        t = JSON.parse(t);
        for (var n in t) mt.settings[n] = t[n]
    }
    localStorage.setItem("mt-stats-settings", JSON.stringify(mt.settings));
    var r = function(e) {
        for (var t in e) this[t] = e[t]
    };
    Object.defineProperty(r.prototype, "time", {
        get: function() {
            return this.timeStamp * 1e3
        },
        enumerable: !0
    }), mt.stats.register = function(e, t) {
        mt.stats.functions.some(function(n) {
            return n.f === e && n.t === t
        }) || mt.stats.functions.push({
            f: e,
            t: t
        })
    }, mt.stats.unregister = function(e, t) {
        mt.stats.functions = mt.stats.functions.filter(function(n) {
            return n.f !== e || n.t !== t
        })
    }, mt.stats.save = function(e, t) {
        mt.settings[e] = t, localStorage.setItem("mt-stats-settings", JSON.stringify(mt.settings))
    }, $.getJSON(mt.settings.url + "/" + mt.settings.graphRange / 1e3, function(e) {
        for (var t = 0, n = e.statsList.stats.length; t < n; t++) mt.stats.data.push(new r(e.statsList.stats[t]));
        setInterval(i, mt.settings.interval), i()
    }), mt.stats.load = function(e, t, n) {
        if (mt.stats.data[0].time > e) $.getJSON(mt.settings.url + "/" + e / 1e3 + "-" + t / 1e3, function(e) {
            var t = [],
                i = e.statsList.stats.length - 1;
            while (e.statsList.stats[i].timeStamp >= mt.stats.data[0].timeStamp && --i >= 0);
            for (var o = 0; o <= i; o++) t.push(new r(e.statsList.stats[o]));
            mt.stats.data = t.concat(mt.stats.data), mt.stats.start = 1, s(), n()
        });
        else {
            mt.stats.start = 0;
            while (mt.stats.data[mt.stats.start].time < e && mt.stats.start++ < mt.stats.end);
            s(), n()
        }
    }
})
