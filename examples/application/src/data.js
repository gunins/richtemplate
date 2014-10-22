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
                class:'warning'
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
                class:'danger'

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
                class:'info'
            }
        ],
        hbind: {
            sometest1: 'bd-someTest1',
            sometest2: 'bd-someTest2',
            sometest3: 'bd-someTest3'
        }
    }
});