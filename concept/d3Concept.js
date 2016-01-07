define(['D3Parser'], function (D3Parser) {
    // General concept there is to use d3 advantage, but you see all elements in scope, also auto redrawing when data is changed.
    // This will helps make d3 widgets more readable.
    // Possibly there need some mixins functionality, which will make data compatable to current d3 structure.
    // Also window and component resize should be included in widget.

    // Need to implement child widget concept for things, such as tooltips, or custom axis, custom interpolations.
    return D3Parser.extend({
        beforeInit: function (options, parent, data) {
            // There is place for preparing data, set some interpolation functions etc.
        },

        init:    function (options, parent, data) {
            // There can trigger functions, when data is rendered.
            // this.root equals var svg = d3.select('svg') which is root element
            // there is listener for changing  this.data. Each time data is changed, triggering transition.

        },
        setData: function (data) {
            // equals svg.data(this.data) data = this.data
            return data;
        },
        // Each of these methods are different from Stonewall, because I want to make close to d3 native API.
        enter:   {
            //Triggers always, when date is set, or initialised.
            bubble_group: function (el) {
                //equals var bubble_group = svg.selectAll('.bubble_group').enter();
                // example
                el.attr('transform', function (d) {
                    return d.transform;
                })
            },
            circle_test:  function (el) {
                //equals var bubble_group.selectAll('.circle_test').enter();
                // example
                el.style('color', function (d) {
                    return d.color;
                })
            }

        },
        exit:    {
            //Exit triggering, every time when binded data is removed
            bubble_group: function (el) {
                //equals var bubble_group = svg.selectAll('.bubble_group').exit();
                // example
                el.remove();
            },
            circle_test:  function (el) {
                //equals var bubble_group.selectAll('.circle_test').exit();
                // example
                el.remove()
            }
        },
        change:  {
            // Triggering transition, every time when data changing.
            bubble_group: function (el) {
                //equals var bubble_group = svg.selectAll('.bubble_group').transition();
                // example
                el.attr('transform', function (d) {
                    return d.transform;
                })
            },
            circle_test:  function (el) {
                //equals var bubble_group.selectAll('.circle_test').transition();
                // example
                el.style('color', function (d) {
                    return d.color;
                })
            }
        },
        events:  {
            // Adding Events to elements
            bubble_group: [{
                name: 'click',
                action: function (e, el) {
                    //equals var bubble_group = svg.selectAll('.bubble_group').transition();
                    // example
                    el.attr('transform', function (d) {
                        return d.transform;
                    })
                }
            }]
        }
    });
});