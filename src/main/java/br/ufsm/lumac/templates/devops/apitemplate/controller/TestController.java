package br.ufsm.lumac.templates.devops.apitemplate.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/hello-world")
    ResponseEntity<String> helloWorldMessage() {
        return new ResponseEntity<String>("Hello World", null, HttpStatus.OK);
    }

    @GetMapping("/hello-world2")
    ResponseEntity<String> helloWorldMessage2() {
        return new ResponseEntity<String>("Hello World", null, HttpStatus.OK);
    }

}
