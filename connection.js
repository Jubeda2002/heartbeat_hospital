var mysql=require("mysql");
var util=require("util");
var conn=mysql.createConnection({
	"host":"bjggynpor9l8tkxsngoc-mysql.services.clever-cloud.com",
	"user":"usd6jvwiumne7mgr",
	"password":"1uk5LmSfuuXvuEqqx22f",
	"database":"bjggynpor9l8tkxsngoc"
});
var exe=util.promisify(conn.query).bind(conn);
module.exports=exe;

