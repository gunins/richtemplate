/**
 * Created by guntars on 10/10/2014.
 */
define({
    table: {
        firstname: 'Some Name',
        firstvalue: {
            placetext: 'place Text',
            placetext2: 'place Text 2'
        },
        thead: {
            headvalue: '#',
            headset: 'Set',
            headelement: 'Element',
            headtest: 'test',
            headother: 'Other'
        },
        tbody: [
            {
                value: {
                    text: '1,001',
                    color: 'red'
                },
                set: 'Lorem',
                element: 'ipsum',
                test: 'dolor',
                other: 'sit',
                class: 'warning'
            },
            {
                value: {
                    text: '1,002',
                    color: 'blue'
                },
                set: 'amet',
                element: 'consectetur',
                test: 'adipiscing',
                other: 'elit',
                class: 'danger'

            },
            {
                value: {
                    text: '1,003',
                    color: 'yellow'
                },
                set: 'Integer',
                element: 'nec',
                test: 'odio',
                other: 'Praesent',
                class: 'info'
            }
        ],
        link: {
            text: 'bd-someTest1',
            href: 'bd-someTest2'
        }
    },
    sidebar: {
        group: [
            {
                links: [
                    {link: {text: 'Reports', href: '#link1'}, class: 'active'},
                    {link: {text: 'Analytics', href: '#link2'}, class: 'inactive'},
                    {link: {text: 'Export', href: '#link3'}, class: 'inactive'},
                    {link: {text: 'Nav item', href: '#link4'}, class: 'inactive'}
                ]
            },
            {
                links: [
                    {link: {text: 'Nav item again', href: '#link4'}, class: 'inactive' },
                    {link: {text: 'One more nav', href: '#link5'}, class: 'inactive'},
                    {link: {text: 'Another nav item', href: '#link6'}, class: 'inactive'},
                    {link: {text: 'More navigation', href: '#link7'}, class: 'inactive'}
                ]
            },
            {
                links: [
                    {link: {text: 'Nav item again', href: '#link8'}, class: 'inactive'},
                    {link: {text: 'One more nav', href: '#link9'}, class: 'inactive'},
                    {link: {text: 'Another nav item', href: '#link10'}, class: 'inactive'}
                ]
            },
        ]
    }

});