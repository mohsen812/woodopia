/*
============================================================
 FEEMAAS CUSTOMER PANEL
 PROJECT DETAIL WORKSPACE
============================================================
*/


function openCustomerProject(project){


    const container =
        document.getElementById(
            "customer-view"
        );


    if(!container){

        return;

    }



    const statusMap = {

        draft:"پیش‌نویس",

        tender:"در مناقصه",

        production:"در تولید",

        completed:"تکمیل شده"

    };



    container.innerHTML = `


<div class="project-detail-page">



<header class="project-detail-header">


    <div>

        <span class="eyebrow">
            PROJECT WORKSPACE
        </span>


        <h2>
            ${escapeHtml(project.title)}
        </h2>


        <p>
            ${escapeHtml(
                project.description ||
                "بدون توضیحات"
            )}
        </p>


    </div>



    <div class="project-status-large">

        <span class="status-dot"></span>

        ${
            statusMap[project.status]
            ||
            project.status
        }

    </div>



</header>





<section class="project-summary-grid">



<div class="project-summary-card">

<h3>
📁 فایل‌ها
</h3>

<strong>
0
</strong>

<span>
فایل و طراحی
</span>

</div>





<div class="project-summary-card">

<h3>
💬 گفتگو
</h3>

<strong>
0
</strong>

<span>
پیام جدید
</span>

</div>





<div class="project-summary-card">

<h3>
◇ مناقصه
</h3>

<strong>
-
</strong>

<span>
پیشنهاد کارگاه‌ها
</span>

</div>





<div class="project-summary-card">

<h3>
📄 قرارداد
</h3>

<strong>
-
</strong>

<span>
وضعیت قرارداد
</span>

</div>




</section>






<section class="project-overview-panel">


<h3>
خلاصه پروژه
</h3>



<div class="project-meta-row">

<span>
شناسه پروژه
</span>

<strong>
#${project.id}
</strong>

</div>



<div class="project-meta-row">

<span>
مرحله فعلی
</span>

<strong>
${
statusMap[project.status]
||
project.status
}
</strong>

</div>




<div class="project-meta-row">

<span>
تاریخ ایجاد
</span>

<strong>
${
project.created_at || "-"
}
</strong>

</div>



</section>








<section class="project-timeline">


<h3>
روند پروژه
</h3>


<div class="timeline">


<div class="timeline-item active">
ثبت سفارش
</div>


<div class="timeline-item active">
بررسی اولیه
</div>


<div class="timeline-item active">
مناقصه
</div>


<div class="timeline-item">
انتخاب کارگاه
</div>


<div class="timeline-item">
تولید و تحویل
</div>


</div>


</section>






</div>


`;



}



window.openCustomerProject =
openCustomerProject;