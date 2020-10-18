# Reglas de negocio

- Los **administradores** crean pacientes, personal médico (enfermeros, doctores y laboratoristas), consultorios y habitaciones
- Los **administradores** internan pacientes
- Los **administradores** dan de alta pacientes internados
- Los **administradores** asignan personal médico a habitaciones
- Los **administradores** asignan doctores a consultorios

- Los **pacientes** tienen diagnósticos, exámenes médicos e historial clínico

- Los *PACIENTES INTERNADOS* tienen asignados uno o varios **enfermeros** en *TURNO*
- Los *PACIENTES INTERNADOS* tienen asignados un **doctor** en *TURNO*
- Los *PACIENTES INTERNADOS* tienen asignados una *HABITACIÓN*
- Los *PACIENTES TRANSITORIOS* tienen asignado un *CONSULTORIO MÉDICO*

- Los **doctores** tienen asignado un *CONSULTORIO MÉDICO*
- Los **doctores** solicitan *EXÁMENES MÉDICOS*
- Los **doctores** tienen asignado un *TURNO* de 8 horas, ya sea mañana, tarde o noche

- Los **doctores** y **administradores** asignan un diagnóstico
- Los **doctores** y **administradores** transfieren un paciente

- Los **enfermeros** y **doctores** tienen asignados varios *PACIENTES INTERNADOS*
- Los **enfermeros** y **doctores** tienen asignados varias *HABITACIONES*
- Los **enfermeros** y **doctores** ven el *HISTORIAL* del *PACIENTE ASIGNADO*
- Los **enfermeros** y **doctores** ven los *EXÁMENES MÉDICOS* del *PACIENTE ASIGNADO*
- Los **enfermeros** y **doctores** asignan *CITA* a un *PACIENTE TRANSITORIO*
- Los **enfermeros**, **doctores** y **laboratoristas** consultan los *RESULTADOS* médicos del *PACIENTE ASIGNADO*

- Los **laboratoristas** generan los *RESULTADOS* de los *EXÁMENES MÉDICOS*

# Comentarios

- Los **doctores** pueden ser asignados a una o muchas habitaciones durante su rotación, así como cumplir funciones de consulta en el área de pacientes transitorios.
- Los **enfermeros** solamente tienen funciones dentro del área de pacientes internados, y un **enfermero** podrá cubrir más de una *HABITACIÓN* durante su *TURNO*.
- Los *EXÁMENES MÉDICOS* se solicitan desde la plataforma y los **enfermeros** podrán visualizarlos en caso de que ellos tengan que cubrir alguna función en el examen médico (como la toma de muestras).
- Los **laboratoristas** reciben la solicitud y el material para trabajar y generan un *EXAMEN MÉDICO* de resultado (en PDF), así como un breve *DIAGNÓSTICO* (si es posible) como detalle extra en la solicitud.
- Todo el **personal médico**, así como los **pacientes**, son dados de alta directamente por el perfil de **administrador**, y solo pueden ser modificados por él.
- En caso de que un *PACIENTE* sea transferido a otra unidad (que puede ser cuidados intensivo, quirófano o piso), se mantendrá su *HISTORIAL MÉDICO*.
