const initPageConfig = {
    component: `
    <div class="main">
        <div class="container">
            <div>
                <img src="https://res.cloudinary.com/diroilukd/image/upload/v1702766105/shape-1_wld59w.png"
                    class="side-element-1">
            </div>
            <div class="text">
                <h1>Medify</h1>
                <h2>Click on create image or create gif to see the API in action</h2>
            </div>
            <div>
                <img src="https://res.cloudinary.com/diroilukd/image/upload/v1702766150/shape-2_phblyh.png" class="side-element-2">
            </div>

    `,
    styles: `
    body {
        margin: 0;
        padding: 0;
        background-color: #fff4da;

    }

    .main {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .container {

        display: flex;
    }

    .text {
        text-align: center;
    }

    .text > h1 {
        font-family: 'Silkscreen', sans-serif;
        font-size: 100px;
        color: #ff6b6b;
        margin: 0;
    }

    .text > h2 {
        font-family: 'Manrope', sans-serif;
        font-size: 20px;
        color:rgb(14, 13, 13)
    }

    .container> div > img {
        width: 7rem;
        height: 7rem;
        min-width: 140px;
        min-height: 140px;
        padding: 2rem;
    }

    .side-element-1 {
        animation: rotate 2s linear infinite;
    }

    .side-element-2 {
        margin-top: 7rem;
        animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(180deg);
        }
    }
    `
};
export default initPageConfig;