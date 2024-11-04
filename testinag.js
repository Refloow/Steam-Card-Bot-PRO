        document.addEventListener('DOMContentLoaded', function() {
            document.body.addEventListener('click', function() {
                console.log("Body clicked!");
                document.body.style.backgroundColor = 'red';
            });
        });
